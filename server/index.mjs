import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { URL } from "node:url";
import { loadConfig } from "./config.mjs";
import { createDbPool } from "./db.mjs";
import { hashPassword, verifyPassword } from "./password.mjs";

const config = loadConfig();
const dataPool = createDbPool(config.dataDb);
const authPool = createDbPool(config.authDb);

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function noContent(res, headers = {}) {
  res.writeHead(204, headers);
  res.end();
}

function parseCookies(req) {
  const source = req.headers.cookie ?? "";
  return Object.fromEntries(
    source
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf("=");
        if (separator === -1) return [item, ""];
        return [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
      }),
  );
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let payload = "";
    req.on("data", (chunk) => {
      payload += chunk;
      if (payload.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!payload) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(payload));
      } catch {
        reject(new Error("Invalid JSON payload"));
      }
    });
    req.on("error", reject);
  });
}

function buildLike(term) {
  return `%${term}%`;
}

function coerceNumber(value) {
  return Number(value ?? 0) || 0;
}

function mapTenantStatus(value) {
  if (value === "Y") return "active";
  if (value === "N") return "suspended";
  if (value === "T") return "test";
  return "decommissioned";
}

function mapUserStatus(value) {
  return value === "Y" ? "active" : "disabled";
}

function mapCampaignStatus(value) {
  if (value === "Y") return "active";
  if (value === "N") return "paused";
  if (value === "D") return "draft";
  return "archived";
}

function mapDidStatus(value) {
  if (value === "Y") return "active";
  if (value === "Q") return "quarantined";
  if (value === "R") return "reserved";
  return "free";
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSessionToken(token) {
  return createHash("sha256").update(`${config.sessionSecret}:${token}`).digest("hex");
}

function sessionCookie(token) {
  const secure = config.isProduction ? "; Secure" : "";
  const maxAge = config.sessionDays * 24 * 60 * 60;
  return `${config.sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie() {
  const secure = config.isProduction ? "; Secure" : "";
  return `${config.sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function normalizeAuthUser(row) {
  return {
    id: `PORTAL-${row.id}`,
    numericId: row.id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    lastLoginAt: row.last_login_at ? (row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at) : "Never",
  };
}

function toSession(user) {
  return {
    id: `PORTAL-${user.id}`,
    fullName: user.full_name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

async function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const rawToken = cookies[config.sessionCookieName];
  if (!rawToken) {
    json(res, 401, { error: "Authentication required" });
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const [rows] = await authPool.query(
    `
      SELECT
        ps.id AS session_id,
        ps.user_id,
        ps.expires_at,
        pu.full_name,
        pu.username,
        pu.email,
        pu.role,
        pu.status
      FROM portal_sessions ps
      INNER JOIN portal_users pu ON pu.id = ps.user_id
      WHERE ps.token_hash = ? AND ps.expires_at > UTC_TIMESTAMP()
      LIMIT 1
    `,
    [tokenHash],
  );

  const session = rows[0];
  if (!session || session.status !== "active") {
    json(res, 401, { error: "Session expired" }, { "Set-Cookie": clearSessionCookie() });
    return null;
  }

  await authPool.query("UPDATE portal_sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?", [session.session_id]);
  return session;
}

function assertAdmin(session, res) {
  if (session.role !== "admin") {
    json(res, 403, { error: "Admin access required" });
    return false;
  }
  return true;
}

function mapTenantRow(row) {
  return {
    id: String(row.tenant_id),
    name: String(row.tenant_name),
    domain: String(row.domain_list || row.tenant_email_id || ""),
    billingCode: String(row.tenant_id),
    accountManager: "Replica DB",
    createdAt: row.tenant_created_on,
    status: mapTenantStatus(String(row.tenant_status)),
    notes: "Live data sourced through the Yaxxa portal API backend.",
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

async function handleTenantMetrics(res) {
  const [rows] = await dataPool.query(`
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

  json(res, 200, {
    ...rows[0],
    source: "backend",
  });
}

async function handleTenants(url, res) {
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const licenseMin = url.searchParams.get("licenseMin");
  const licenseMax = url.searchParams.get("licenseMax");
  const createdFrom = url.searchParams.get("createdFrom");
  const createdTo = url.searchParams.get("createdTo");
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "8");

  const where = ["tm.deleted_at IS NULL"];
  const values = [];

  if (q) {
    where.push("(tm.tenant_name LIKE ? OR CAST(tm.tenant_id AS CHAR) LIKE ? OR tm.tenant_email_id LIKE ? OR tm.domain_list LIKE ?)");
    values.push(buildLike(q), buildLike(q), buildLike(q), buildLike(q));
  }
  if (status && status !== "all") {
    const dbStatus = status === "active" ? "Y" : status === "suspended" ? "N" : status === "test" ? "T" : "X";
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

  const [countRows] = await dataPool.query(
    `SELECT COUNT(*) AS total FROM tenant_master tm WHERE ${where.join(" AND ")}`,
    values,
  );

  const [rows] = await dataPool.query(
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

  json(res, 200, {
    items: rows.map(mapTenantRow),
    total: coerceNumber(countRows[0]?.total),
    page,
    pageSize,
    source: "backend",
  });
}

async function handleTenantDetail(tenantId, res) {
  const [rows] = await dataPool.query(
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

  if (!rows[0]) {
    json(res, 404, { error: "Tenant not found" });
    return;
  }
  json(res, 200, mapTenantRow(rows[0]));
}

async function handleTenantUsers(tenantId, res) {
  const [rows] = await dataPool.query(
    `
      SELECT user_id, user_name, first_name, last_name, email, role_id, user_status, created_on, updated_on
      FROM users
      WHERE deleted_at IS NULL AND tenant_id = ?
      ORDER BY user_name ASC
    `,
    [tenantId],
  );

  json(
    res,
    200,
    rows.map((row) => ({
      id: String(row.user_id),
      tenantId: String(tenantId),
      username: String(row.user_name),
      email: String(row.email || ""),
      role: "agent",
      lastLogin: row.updated_on ?? row.created_on ?? new Date().toISOString(),
      status: mapUserStatus(row.user_status),
      consumesLicense: row.user_status === "Y",
    })),
  );
}

async function handleTenantCampaigns(tenantId, res) {
  const [rows] = await dataPool.query(
    `
      SELECT camp_id, camp_name, camp_type, camp_dialer, camp_status, tenant_id, updated_at
      FROM campaign_master
      WHERE deleted_at IS NULL AND tenant_id = ?
      ORDER BY camp_id DESC
    `,
    [tenantId],
  );

  json(
    res,
    200,
    rows.map((row) => ({
      id: String(row.camp_id),
      tenantId: String(tenantId),
      name: String(row.camp_name),
      type: ["inbound", "outbound", "blended", "preview", "power"].includes(String(row.camp_type).toLowerCase())
        ? String(row.camp_type).toLowerCase()
        : "outbound",
      status: mapCampaignStatus(row.camp_status),
      agentsAssigned: 0,
      dialerType: ["progressive", "predictive", "preview", "power"].includes(String(row.camp_dialer).toLowerCase())
        ? String(row.camp_dialer).toLowerCase()
        : "progressive",
      recentActivityAt: row.updated_at ?? new Date().toISOString(),
      didIds: [],
    })),
  );
}

async function handleTenantDids(tenantId, res) {
  const [rows] = await dataPool.query(
    `
      SELECT did_id, did_number, did_description, did_action_type, did_action_id, did_status, tenant_id, created_at, updated_at
      FROM did_master
      WHERE deleted_at IS NULL AND tenant_id = ?
      ORDER BY did_id DESC
    `,
    [tenantId],
  );

  json(
    res,
    200,
    rows.map((row) => ({
      id: String(row.did_id),
      number: String(row.did_number),
      provider: null,
      trunk: null,
      tenantId: String(tenantId),
      tenantName: null,
      campaignId: row.did_action_type === "CAMPAIGN" ? String(row.did_action_id) : null,
      campaignName: row.did_action_type === "CAMPAIGN" ? `Campaign ${row.did_action_id}` : String(row.did_action_type || "Unassigned"),
      status: mapDidStatus(row.did_status),
      country: String(row.did_number).startsWith("27") ? "South Africa" : "Unknown",
      prefix: String(row.did_number).startsWith("27") ? "+27" : "",
      createdAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    })),
  );
}

async function handleDids(url, res) {
  const q = url.searchParams.get("q");
  const tenantId = url.searchParams.get("tenantId");
  const provider = url.searchParams.get("provider");
  const where = ["dm.deleted_at IS NULL"];
  const values = [];

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

  const [rows] = await dataPool.query(
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

  json(
    res,
    200,
    rows.map((row) => ({
      id: String(row.did_id),
      number: String(row.did_number),
      provider: row.tnk_name ? String(row.tnk_name) : null,
      trunk: row.tnk_name ? String(row.tnk_name) : null,
      tenantId: row.tenant_id ? String(row.tenant_id) : null,
      tenantName: row.tenant_name ? String(row.tenant_name) : null,
      campaignId: row.did_action_type === "CAMPAIGN" ? String(row.did_action_id) : null,
      campaignName: row.did_action_type === "CAMPAIGN" ? `Campaign ${row.did_action_id}` : null,
      status: mapDidStatus(row.did_status),
      country: String(row.did_number).startsWith("27") ? "South Africa" : "Unknown",
      prefix: String(row.did_number).startsWith("27") ? "+27" : "",
      createdAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    })),
  );
}

async function handlePortalMeta(res) {
  const [rows] = await authPool.query(
    "SELECT id, full_name, username, email, role, status, created_at, last_login_at FROM portal_users ORDER BY full_name ASC",
  );
  json(res, 200, rows.map(normalizeAuthUser));
}

async function countOtherActiveAdmins(userId) {
  const [rows] = await authPool.query(
    "SELECT COUNT(*) AS total FROM portal_users WHERE id <> ? AND role = 'admin' AND status = 'active'",
    [userId],
  );
  return coerceNumber(rows[0]?.total);
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const corsHeaders = {
    ...(origin && origin === config.appOrigin
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          Vary: "Origin",
        }
      : {}),
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
    const path = url.pathname;

    if (path === "/api/health") {
      const [rows] = await dataPool.query("SELECT 1 AS ok");
      json(res, 200, { ok: Boolean(rows[0]?.ok) }, corsHeaders);
      return;
    }

    if (path === "/api/auth/login" && req.method === "POST") {
      const body = await parseBody(req);
      const username = String(body.username ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      const [rows] = await authPool.query(
        `
          SELECT id, full_name, username, email, password_hash, role, status
          FROM portal_users
          WHERE LOWER(username) = ?
          LIMIT 1
        `,
        [username],
      );

      const user = rows[0];
      if (!user || user.status !== "active") {
        json(res, 401, { error: "Invalid username or password" }, corsHeaders);
        return;
      }

      const passwordOk = await verifyPassword(password, user.password_hash);
      if (!passwordOk) {
        json(res, 401, { error: "Invalid username or password" }, corsHeaders);
        return;
      }

      const rawToken = createSessionToken();
      const tokenHash = hashSessionToken(rawToken);
      await authPool.query(
        `
          INSERT INTO portal_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
          VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY), ?, ?)
        `,
        [user.id, tokenHash, config.sessionDays, req.socket.remoteAddress ?? null, req.headers["user-agent"] ?? null],
      );
      await authPool.query("UPDATE portal_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?", [user.id]);

      json(res, 200, toSession(user), {
        ...corsHeaders,
        "Set-Cookie": sessionCookie(rawToken),
      });
      return;
    }

    if (path === "/api/auth/logout" && req.method === "POST") {
      const cookies = parseCookies(req);
      const rawToken = cookies[config.sessionCookieName];
      if (rawToken) {
        await authPool.query("DELETE FROM portal_sessions WHERE token_hash = ?", [hashSessionToken(rawToken)]);
      }
      noContent(res, {
        ...corsHeaders,
        "Set-Cookie": clearSessionCookie(),
      });
      return;
    }

    if (path === "/api/auth/me" && req.method === "GET") {
      const session = await requireAuth(req, res);
      if (!session) return;
      json(res, 200, {
        id: `PORTAL-${session.user_id}`,
        fullName: session.full_name,
        username: session.username,
        email: session.email,
        role: session.role,
      }, corsHeaders);
      return;
    }

    const session = await requireAuth(req, res);
    if (!session) return;

    if (path === "/api/dashboard-metrics" && req.method === "GET") {
      await handleTenantMetrics(res);
      return;
    }

    if (path === "/api/tenants" && req.method === "GET") {
      await handleTenants(url, res);
      return;
    }

    const tenantDetailMatch = path.match(/^\/api\/tenants\/(\d+)$/);
    if (tenantDetailMatch && req.method === "GET") {
      await handleTenantDetail(tenantDetailMatch[1], res);
      return;
    }

    const tenantUsersMatch = path.match(/^\/api\/tenants\/(\d+)\/users$/);
    if (tenantUsersMatch && req.method === "GET") {
      await handleTenantUsers(tenantUsersMatch[1], res);
      return;
    }

    const tenantCampaignsMatch = path.match(/^\/api\/tenants\/(\d+)\/campaigns$/);
    if (tenantCampaignsMatch && req.method === "GET") {
      await handleTenantCampaigns(tenantCampaignsMatch[1], res);
      return;
    }

    const tenantDidsMatch = path.match(/^\/api\/tenants\/(\d+)\/dids$/);
    if (tenantDidsMatch && req.method === "GET") {
      await handleTenantDids(tenantDidsMatch[1], res);
      return;
    }

    if (path === "/api/dids" && req.method === "GET") {
      await handleDids(url, res);
      return;
    }

    if (path === "/api/admin/users" && req.method === "GET") {
      if (!assertAdmin(session, res)) return;
      await handlePortalMeta(res);
      return;
    }

    if (path === "/api/admin/users" && req.method === "POST") {
      if (!assertAdmin(session, res)) return;
      const body = await parseBody(req);
      const fullName = String(body.fullName ?? "").trim();
      const username = String(body.username ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = body.role === "admin" ? "admin" : "viewer";

      if (fullName.length < 2 || username.length < 3 || !email.includes("@") || password.length < 8) {
        json(res, 400, { error: "Invalid user payload" });
        return;
      }

      const [existingRows] = await authPool.query(
        "SELECT id FROM portal_users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1",
        [username.toLowerCase(), email],
      );
      if (existingRows[0]) {
        json(res, 409, { error: "That username or email address already exists." });
        return;
      }

      const passwordHash = await hashPassword(password);
      const [result] = await authPool.query(
        `
          INSERT INTO portal_users (full_name, username, email, password_hash, role, status)
          VALUES (?, ?, ?, ?, ?, 'active')
        `,
        [fullName, username, email, passwordHash, role],
      );
      const [rows] = await authPool.query(
        "SELECT id, full_name, username, email, role, status, created_at, last_login_at FROM portal_users WHERE id = ?",
        [result.insertId],
      );
      json(res, 201, normalizeAuthUser(rows[0]));
      return;
    }

    const adminUserMatch = path.match(/^\/api\/admin\/users\/PORTAL-(\d+)$/);
    if (adminUserMatch && req.method === "PATCH") {
      if (!assertAdmin(session, res)) return;
      const userId = Number(adminUserMatch[1]);
      const body = await parseBody(req);
      const fullName = String(body.fullName ?? "").trim();
      const username = String(body.username ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const role = body.role === "admin" ? "admin" : "viewer";

      const [collisionRows] = await authPool.query(
        "SELECT id FROM portal_users WHERE id <> ? AND (LOWER(username) = ? OR LOWER(email) = ?) LIMIT 1",
        [userId, username.toLowerCase(), email],
      );
      if (collisionRows[0]) {
        json(res, 409, { error: "That username or email address already exists." });
        return;
      }

      await authPool.query(
        "UPDATE portal_users SET full_name = ?, username = ?, email = ?, role = ? WHERE id = ?",
        [fullName, username, email, role, userId],
      );
      const [rows] = await authPool.query(
        "SELECT id, full_name, username, email, role, status, created_at, last_login_at FROM portal_users WHERE id = ?",
        [userId],
      );
      json(res, 200, normalizeAuthUser(rows[0]));
      return;
    }

    const resetPasswordMatch = path.match(/^\/api\/admin\/users\/PORTAL-(\d+)\/reset-password$/);
    if (resetPasswordMatch && req.method === "POST") {
      if (!assertAdmin(session, res)) return;
      const userId = Number(resetPasswordMatch[1]);
      const body = await parseBody(req);
      const password = String(body.password ?? "");
      if (password.length < 8) {
        json(res, 400, { error: "Password must be at least 8 characters." });
        return;
      }
      const passwordHash = await hashPassword(password);
      await authPool.query("UPDATE portal_users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
      noContent(res);
      return;
    }

    const statusMatch = path.match(/^\/api\/admin\/users\/PORTAL-(\d+)\/status$/);
    if (statusMatch && req.method === "POST") {
      if (!assertAdmin(session, res)) return;
      const userId = Number(statusMatch[1]);
      const body = await parseBody(req);
      const status = body.status === "disabled" ? "disabled" : "active";

      const [rows] = await authPool.query(
        "SELECT id, full_name, username, email, role, status, created_at, last_login_at FROM portal_users WHERE id = ?",
        [userId],
      );
      const targetUser = rows[0];
      if (!targetUser) {
        json(res, 404, { error: "Portal user not found." });
        return;
      }
      if (targetUser.role === "admin" && status === "disabled" && (await countOtherActiveAdmins(userId)) === 0) {
        json(res, 400, { error: "At least one active admin account must remain." });
        return;
      }

      await authPool.query("UPDATE portal_users SET status = ? WHERE id = ?", [status, userId]);
      if (status === "disabled") {
        await authPool.query("DELETE FROM portal_sessions WHERE user_id = ?", [userId]);
      }
      const [updatedRows] = await authPool.query(
        "SELECT id, full_name, username, email, role, status, created_at, last_login_at FROM portal_users WHERE id = ?",
        [userId],
      );
      json(res, 200, normalizeAuthUser(updatedRows[0]));
      return;
    }

    if (adminUserMatch && req.method === "DELETE") {
      if (!assertAdmin(session, res)) return;
      const userId = Number(adminUserMatch[1]);
      const [rows] = await authPool.query("SELECT role FROM portal_users WHERE id = ?", [userId]);
      const targetUser = rows[0];
      if (!targetUser) {
        json(res, 404, { error: "Portal user not found." });
        return;
      }
      if (targetUser.role === "admin" && (await countOtherActiveAdmins(userId)) === 0) {
        json(res, 400, { error: "At least one active admin account must remain." });
        return;
      }
      await authPool.query("DELETE FROM portal_users WHERE id = ?", [userId]);
      await authPool.query("DELETE FROM portal_sessions WHERE user_id = ?", [userId]);
      noContent(res);
      return;
    }

    json(res, 404, { error: "Not found" }, corsHeaders);
  } catch (error) {
    console.error(error);
    json(res, 500, {
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

server.listen(config.port, () => {
  console.log(`Yaxxa portal API listening on http://127.0.0.1:${config.port}`);
});
