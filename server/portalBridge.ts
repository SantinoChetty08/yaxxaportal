import type { ServerResponse } from "node:http";
import type { Plugin, ViteDevServer } from "vite";
import mysql from "mysql2/promise";

type TenantStatus = "active" | "suspended" | "test" | "decommissioned";

function mapTenantStatus(value: string | null): TenantStatus {
  if (value === "Y") return "active";
  if (value === "N") return "suspended";
  if (value === "T") return "test";
  return "decommissioned";
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function buildLike(term: string) {
  return `%${term}%`;
}

function coerceNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

function mapTenantRow(row: Record<string, unknown>) {
  return {
    id: String(row.tenant_id),
    name: String(row.tenant_name),
    domain: String(row.domain_list || row.tenant_email_id || ""),
    billingCode: String(row.tenant_id),
    accountManager: "Replica DB",
    createdAt: row.tenant_created_on,
    status: mapTenantStatus(String(row.tenant_status)),
    notes: "Live data from MariaDB replica",
    dialplanTemplate: "DB",
    profileTemplate: "DB",
    licenseSeats: coerceNumber(row.tenant_number_of_agents),
    licenseInUse: coerceNumber(row.active_users),
    peakConcurrentAgents: Array.from({ length: 7 }, () => coerceNumber(row.active_users)),
    activeUsers: coerceNumber(row.active_users),
    totalUsers: coerceNumber(row.total_users),
    didsAllocated: coerceNumber(row.dids_allocated),
    campaignsActive: coerceNumber(row.campaigns_active),
    campaignsTotal: coerceNumber(row.campaigns_total),
    queueCount: 0,
    apiStatus: row.api_access === "1" ? "connected" : "error",
    lastSyncAt: row.tenant_last_updated_on ?? row.tenant_created_on,
    apiTokenMasked: row.api_access === "1" ? "configured" : "not configured",
    integrationFlags: {
      crmSync: false,
      wallboard: true,
      billingHook: false,
      speechAnalytics: false,
    },
    channels: {
      voice: coerceNumber(row.tenant_number_of_agents) > 0,
      email: coerceNumber(row.tenant_number_of_emails) > 0,
      whatsapp: coerceNumber(row.whatsapp_number_of_agents) > 0,
      chat: coerceNumber(row.tenant_chat_agents) > 0,
    },
    healthScore: mapTenantStatus(String(row.tenant_status)) === "active" ? 84 : 55,
    adminUsernames: [],
  };
}

export function createPortalBridgePlugin(env: Record<string, string>): Plugin {
  const enabled = env.VITE_PORTAL_DATA_SOURCE === "bridge";
  if (!enabled) {
    return { name: "portal-bridge-disabled" };
  }

  const pool = mysql.createPool({
    host: env.PORTAL_DB_HOST,
    user: env.PORTAL_DB_USER,
    password: env.PORTAL_DB_PASSWORD,
    database: env.PORTAL_DB_NAME || "hoducc",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });

  return {
    name: "portal-bridge",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/portal-api", async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://127.0.0.1");
          const path = url.pathname.replace(/^\/portal-api/, "") || "/";

          if (path === "/health") {
            const [rows] = await pool.query("SELECT 1 AS ok");
            sendJson(res, 200, { ok: Boolean((rows as Array<{ ok: number }>)[0]?.ok) });
            return;
          }

          if (path === "/dashboard-metrics") {
            const [rows] = await pool.query(`
              SELECT
                COUNT(*) AS totalTenants,
                SUM(CASE WHEN tenant_status = 'Y' THEN 1 ELSE 0 END) AS activeTenants,
                SUM(COALESCE(tenant_number_of_agents, 0)) AS totalAllocatedLicenses,
                SUM(COALESCE(dids.running_calls, 0)) AS totalActiveUsers,
                SUM(COALESCE(dids.allocated, 0)) AS totalAllocatedDids,
                SUM(COALESCE(dids.free_dids, 0)) AS unassignedDids,
                SUM(COALESCE(camps.campaigns_total, 0)) AS totalCampaigns
              FROM tenant_master tm
              LEFT JOIN (
                SELECT
                  tenant_id,
                  COUNT(*) AS allocated,
                  SUM(CASE WHEN did_status = 'Y' AND did_action_id = 0 THEN 1 ELSE 0 END) AS free_dids,
                  SUM(COALESCE(running_calls, 0)) AS running_calls
                FROM did_master
                WHERE deleted_at IS NULL
                GROUP BY tenant_id
              ) dids ON dids.tenant_id = tm.tenant_id
              LEFT JOIN (
                SELECT tenant_id, COUNT(*) AS campaigns_total
                FROM campaign_master
                WHERE deleted_at IS NULL
                GROUP BY tenant_id
              ) camps ON camps.tenant_id = tm.tenant_id
              WHERE tm.deleted_at IS NULL
            `);
            sendJson(res, 200, {
              ...((rows as Array<Record<string, unknown>>)[0] ?? {}),
              source: "db-bridge",
            });
            return;
          }

          if (path === "/tenants") {
            const q = url.searchParams.get("q");
            const status = url.searchParams.get("status");
            const licenseMin = url.searchParams.get("licenseMin");
            const licenseMax = url.searchParams.get("licenseMax");
            const createdFrom = url.searchParams.get("createdFrom");
            const createdTo = url.searchParams.get("createdTo");
            const page = Number(url.searchParams.get("page") ?? "1");
            const pageSize = Number(url.searchParams.get("pageSize") ?? "8");

            const where: string[] = ["tm.deleted_at IS NULL"];
            const values: Array<string | number> = [];

            if (q) {
              where.push("(tm.tenant_name LIKE ? OR CAST(tm.tenant_id AS CHAR) LIKE ? OR tm.tenant_email_id LIKE ? OR tm.domain_list LIKE ?)");
              values.push(buildLike(q), buildLike(q), buildLike(q), buildLike(q));
            }
            if (status && status !== "all") {
              const dbStatus = status === "active" ? "Y" : status === "suspended" ? "N" : "X";
              where.push("tm.tenant_status = ?");
              values.push(dbStatus);
            }
            if (licenseMin) {
              where.push("COALESCE(tm.tenant_number_of_agents, 0) >= ?");
              values.push(Number(licenseMin));
            }
            if (licenseMax) {
              where.push("COALESCE(tm.tenant_number_of_agents, 0) <= ?");
              values.push(Number(licenseMax));
            }
            if (createdFrom) {
              where.push("DATE(tm.tenant_created_on) >= ?");
              values.push(createdFrom);
            }
            if (createdTo) {
              where.push("DATE(tm.tenant_created_on) <= ?");
              values.push(createdTo);
            }

            const [countRows] = await pool.query(
              `SELECT COUNT(*) AS total FROM tenant_master tm WHERE ${where.join(" AND ")}`,
              values,
            );

            const [rows] = await pool.query(
              `
                SELECT
                  tm.tenant_id,
                  tm.tenant_name,
                  tm.tenant_email_id,
                  tm.tenant_status,
                  tm.tenant_created_on,
                  tm.tenant_last_updated_on,
                  tm.tenant_number_of_agents,
                  tm.tenant_number_of_emails,
                  tm.tenant_chat_agents,
                  tm.sms_number_of_agents,
                  tm.whatsapp_number_of_agents,
                  tm.number_of_tl,
                  tm.number_of_supervisor,
                  tm.api_access,
                  tm.user_role_access,
                  tm.enable_report_scheduler,
                  tm.enable_ticket,
                  tm.domain_list,
                  COALESCE(u.total_users, 0) AS total_users,
                  COALESCE(u.active_users, 0) AS active_users,
                  COALESCE(d.dids_allocated, 0) AS dids_allocated,
                  COALESCE(c.campaigns_total, 0) AS campaigns_total,
                  COALESCE(c.campaigns_active, 0) AS campaigns_active
                FROM tenant_master tm
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS total_users, SUM(CASE WHEN user_status = 'Y' THEN 1 ELSE 0 END) AS active_users
                  FROM users
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) u ON u.tenant_id = tm.tenant_id
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS dids_allocated
                  FROM did_master
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) d ON d.tenant_id = tm.tenant_id
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS campaigns_total, SUM(CASE WHEN camp_status = 'Y' THEN 1 ELSE 0 END) AS campaigns_active
                  FROM campaign_master
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) c ON c.tenant_id = tm.tenant_id
                WHERE ${where.join(" AND ")}
                ORDER BY tm.tenant_id ASC
                LIMIT ? OFFSET ?
              `,
              [...values, pageSize, (page - 1) * pageSize],
            );

            const items = (rows as Array<Record<string, unknown>>).map(mapTenantRow);

            sendJson(res, 200, {
              items,
              total: coerceNumber((countRows as Array<Record<string, unknown>>)[0]?.total),
              page,
              pageSize,
              source: "db-bridge",
            });
            return;
          }

          const tenantMatch = path.match(/^\/tenants\/(\d+)$/);
          if (tenantMatch) {
            const tenantId = tenantMatch[1];
            const [rows] = await pool.query(
              `
                SELECT
                  tm.tenant_id,
                  tm.tenant_name,
                  tm.tenant_email_id,
                  tm.tenant_status,
                  tm.tenant_created_on,
                  tm.tenant_last_updated_on,
                  tm.tenant_number_of_agents,
                  tm.tenant_number_of_emails,
                  tm.tenant_chat_agents,
                  tm.sms_number_of_agents,
                  tm.whatsapp_number_of_agents,
                  tm.number_of_tl,
                  tm.number_of_supervisor,
                  tm.api_access,
                  tm.user_role_access,
                  tm.enable_report_scheduler,
                  tm.enable_ticket,
                  tm.domain_list,
                  COALESCE(u.total_users, 0) AS total_users,
                  COALESCE(u.active_users, 0) AS active_users,
                  COALESCE(d.dids_allocated, 0) AS dids_allocated,
                  COALESCE(c.campaigns_total, 0) AS campaigns_total,
                  COALESCE(c.campaigns_active, 0) AS campaigns_active
                FROM tenant_master tm
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS total_users, SUM(CASE WHEN user_status = 'Y' THEN 1 ELSE 0 END) AS active_users
                  FROM users
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) u ON u.tenant_id = tm.tenant_id
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS dids_allocated
                  FROM did_master
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) d ON d.tenant_id = tm.tenant_id
                LEFT JOIN (
                  SELECT tenant_id, COUNT(*) AS campaigns_total, SUM(CASE WHEN camp_status = 'Y' THEN 1 ELSE 0 END) AS campaigns_active
                  FROM campaign_master
                  WHERE deleted_at IS NULL
                  GROUP BY tenant_id
                ) c ON c.tenant_id = tm.tenant_id
                WHERE tm.deleted_at IS NULL AND tm.tenant_id = ?
                LIMIT 1
              `,
              [tenantId],
            );

            const tenant = (rows as Array<Record<string, unknown>>)[0];
            if (!tenant) {
              sendJson(res, 404, { error: "Tenant not found" });
              return;
            }

            sendJson(res, 200, mapTenantRow(tenant));
            return;
          }

          const tenantUsersMatch = path.match(/^\/tenants\/(\d+)\/users$/);
          if (tenantUsersMatch) {
            const tenantId = tenantUsersMatch[1];
            const [rows] = await pool.query(
              `
                SELECT user_id, user_name, first_name, last_name, email, role_id, user_status, created_on, updated_on
                FROM users
                WHERE deleted_at IS NULL AND tenant_id = ?
                ORDER BY user_name ASC
              `,
              [tenantId],
            );
            sendJson(
              res,
              200,
              (rows as Array<Record<string, unknown>>).map((row) => ({
                id: String(row.user_id),
                tenantId,
                username: String(row.user_name),
                email: String(row.email || ""),
                role: `role-${row.role_id}`,
                lastLogin: row.updated_on ?? row.created_on ?? new Date().toISOString(),
                status: row.user_status === "Y" ? "active" : "disabled",
                consumesLicense: row.user_status === "Y",
              })),
            );
            return;
          }

          const tenantCampaignsMatch = path.match(/^\/tenants\/(\d+)\/campaigns$/);
          if (tenantCampaignsMatch) {
            const tenantId = tenantCampaignsMatch[1];
            const [rows] = await pool.query(
              `
                SELECT camp_id, camp_name, camp_type, camp_dialer, camp_status, tenant_id, updated_at, queue_channel
                FROM campaign_master
                WHERE deleted_at IS NULL AND tenant_id = ?
                ORDER BY camp_id DESC
              `,
              [tenantId],
            );
            sendJson(
              res,
              200,
              (rows as Array<Record<string, unknown>>).map((row) => ({
                id: String(row.camp_id),
                tenantId,
                name: String(row.camp_name),
                type: String(row.camp_type || "").toLowerCase(),
                status: row.camp_status === "Y" ? "active" : row.camp_status === "N" ? "paused" : "archived",
                agentsAssigned: 0,
                dialerType: String((row.camp_dialer || "MANUAL")).toLowerCase(),
                recentActivityAt: row.updated_at ?? new Date().toISOString(),
                didIds: [],
              })),
            );
            return;
          }

          const tenantDidsMatch = path.match(/^\/tenants\/(\d+)\/dids$/);
          if (tenantDidsMatch) {
            const tenantId = tenantDidsMatch[1];
            const [rows] = await pool.query(
              `
                SELECT did_id, did_number, did_description, did_action_type, did_action_id, did_status, tenant_id, max_call, running_calls, created_at, updated_at
                FROM did_master
                WHERE deleted_at IS NULL AND tenant_id = ?
                ORDER BY did_id DESC
              `,
              [tenantId],
            );
            sendJson(
              res,
              200,
              (rows as Array<Record<string, unknown>>).map((row) => ({
                id: String(row.did_id),
                number: String(row.did_number),
                provider: null,
                trunk: null,
                tenantId,
                tenantName: null,
                campaignId: row.did_action_type === "CAMPAIGN" ? String(row.did_action_id) : null,
                campaignName: row.did_action_type === "CAMPAIGN" ? `Campaign ${row.did_action_id}` : String(row.did_action_type || "Unassigned"),
                status: row.did_status === "Y" ? "active" : "free",
                country: String(row.did_number).startsWith("27") ? "South Africa" : "Unknown",
                prefix: String(row.did_number).startsWith("27") ? "+27" : "",
                createdAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
              })),
            );
            return;
          }

          if (path === "/dids") {
            const q = url.searchParams.get("q");
            const tenantId = url.searchParams.get("tenantId");
            const provider = url.searchParams.get("provider");
            const where: string[] = ["dm.deleted_at IS NULL"];
            const values: Array<string | number> = [];
            if (q) {
              where.push("(dm.did_number LIKE ? OR dm.did_description LIKE ?)");
              values.push(buildLike(q), buildLike(q));
            }
            if (tenantId) {
              where.push("dm.tenant_id = ?");
              values.push(tenantId);
            }
            if (provider) {
              where.push("tm.tnk_name LIKE ?");
              values.push(buildLike(provider));
            }

            const [rows] = await pool.query(
              `
                SELECT dm.did_id, dm.did_number, dm.did_description, dm.did_action_type, dm.did_action_id, dm.did_status, dm.tenant_id, dm.created_at, dm.updated_at,
                       ten.tenant_name,
                       tm.tnk_name
                FROM did_master dm
                LEFT JOIN tenant_master ten ON ten.tenant_id = dm.tenant_id
                LEFT JOIN trunk_master tm ON tm.tenant_id = dm.tenant_id
                WHERE ${where.join(" AND ")}
                ORDER BY dm.did_id DESC
                LIMIT 5000
              `,
              values,
            );
            sendJson(
              res,
              200,
              (rows as Array<Record<string, unknown>>).map((row) => ({
                id: String(row.did_id),
                number: String(row.did_number),
                provider: row.tnk_name ? String(row.tnk_name) : null,
                trunk: row.tnk_name ? String(row.tnk_name) : null,
                tenantId: row.tenant_id ? String(row.tenant_id) : null,
                tenantName: row.tenant_name ? String(row.tenant_name) : null,
                campaignId: row.did_action_type === "CAMPAIGN" ? String(row.did_action_id) : null,
                campaignName: row.did_action_type === "CAMPAIGN" ? `Campaign ${row.did_action_id}` : null,
                status: row.did_status === "Y" ? "active" : "free",
                country: String(row.did_number).startsWith("27") ? "South Africa" : "Unknown",
                prefix: String(row.did_number).startsWith("27") ? "+27" : "",
                createdAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
              })),
            );
            return;
          }

          sendJson(res, 404, { error: "Not found" });
        } catch (error) {
          sendJson(res, 500, {
            error: error instanceof Error ? error.message : "Bridge error",
          });
        }
      });
    },
  };
}
