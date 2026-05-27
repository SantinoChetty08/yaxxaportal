import {
  accountManagers,
  auditEventsSeed,
  didsSeed,
  dialplanTemplates,
  profileTemplates,
  tenantCampaignsSeed,
  tenantsSeed,
  tenantUsersSeed,
} from "@/mocks/data";
import type {
  AuthSession,
  AdminDashboardData,
  AuditEvent,
  CreatePortalUserInput,
  CreateTenantInput,
  DashboardMetrics,
  DidFilters,
  DidRecord,
  PaginatedResult,
  PortalUserAccount,
  Tenant,
  TenantCampaign,
  TenantListFilters,
  TenantUser,
  TenantStatus,
  UpdatePortalUserInput,
  UserStatus,
} from "@/types";

const delay = async (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const PORTAL_DATA_SOURCE = import.meta.env.VITE_PORTAL_DATA_SOURCE ?? "mock";
const PORTAL_AUTH_MODE = import.meta.env.VITE_PORTAL_AUTH_MODE ?? "mock";
const PORTAL_API_BASE_URL = import.meta.env.VITE_PORTAL_API_BASE_URL?.replace(/\/$/, "") ?? "";
const YAXXA_API_BASE_URL = import.meta.env.VITE_YAXXA_API_BASE_URL?.replace(/\/$/, "") ?? "https://omni.yaxxa.co.za/YaxxaCC_api/v2.1";
const YAXXA_API_TOKEN = import.meta.env.VITE_YAXXA_API_TOKEN ?? "";
const YAXXA_API_TENANT_IDS = import.meta.env.VITE_YAXXA_API_TENANT_IDS
  ? import.meta.env.VITE_YAXXA_API_TENANT_IDS.split(",").map((value: string) => value.trim()).filter(Boolean)
  : [];
const hasBridgeDataSource = PORTAL_DATA_SOURCE === "bridge";
const hasBackendDataSource = PORTAL_DATA_SOURCE === "backend";
const hasBackendAuth = PORTAL_AUTH_MODE === "backend";
const hasYaxxaApiConfig = Boolean(YAXXA_API_TOKEN);

let tenants = structuredClone(tenantsSeed);
let users = structuredClone(tenantUsersSeed);
let campaigns = structuredClone(tenantCampaignsSeed);
let dids = structuredClone(didsSeed);
let auditEvents = structuredClone(auditEventsSeed);
let portalUsers: PortalUserAccount[] = [
  {
    id: "PORTAL-1",
    fullName: "Sarah Mitchell",
    username: "admin",
    email: "sarah.mitchell@yaxxa.internal",
    password: "Admin@123",
    role: "admin",
    status: "active",
    createdAt: "2026-01-01T08:00:00Z",
    lastLoginAt: "2026-05-27T07:00:00Z",
  },
  {
    id: "PORTAL-2",
    fullName: "Jordan Viewer",
    username: "viewer",
    email: "jordan.viewer@yaxxa.internal",
    password: "Viewer@123",
    role: "viewer",
    status: "active",
    createdAt: "2026-02-12T08:00:00Z",
    lastLoginAt: "2026-05-27T06:15:00Z",
  },
];

function toQueryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function getBridge<T>(path: string): Promise<T> {
  const response = await fetch(`/portal-api${path}`);
  if (!response.ok) {
    throw new Error(`Portal bridge request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function getBackendUrl(path: string) {
  return `${PORTAL_API_BASE_URL}${path}`;
}

async function requestBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getBackendUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let message = `Portal API request failed with HTTP ${response.status}`;
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function assertMutablePortal() {
  if (hasBridgeDataSource || hasBackendDataSource) {
    throw new Error("Live replica mode is read-only. Use the production admin API or backend service for changes.");
  }
}

async function postYaxxa<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${YAXXA_API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: YAXXA_API_TOKEN,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Yaxxa API request failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.code && Number(json.code) >= 400) {
    throw new Error(json.status_message || "Yaxxa API returned an error");
  }

  return json as T;
}

function parseLicensePair(value: string | null | undefined) {
  const [current, total] = String(value ?? "0 / 0")
    .split("/")
    .map((part) => Number(part.trim()) || 0);
  return { current, total };
}

const addAudit = (event: AuditEvent) => {
  auditEvents = [event, ...auditEvents];
};

const refreshTenantDerivedStats = (tenantId: string) => {
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) return;
  const tenantUsers = users.filter((user) => user.tenantId === tenantId);
  const tenantCampaigns = campaigns.filter((campaign) => campaign.tenantId === tenantId);
  const tenantDids = dids.filter((did) => did.tenantId === tenantId);

  tenant.activeUsers = tenantUsers.filter((user) => user.status === "active").length;
  tenant.totalUsers = tenantUsers.length;
  tenant.licenseInUse = tenantUsers.filter((user) => user.status === "active" && user.consumesLicense).length;
  tenant.didsAllocated = tenantDids.length;
  tenant.campaignsTotal = tenantCampaigns.length;
  tenant.campaignsActive = tenantCampaigns.filter((campaign) => campaign.status === "active").length;
};

const searchTenant = (tenant: Tenant, q: string) => {
  const lower = q.toLowerCase();
  const tenantDids = dids.filter((did) => did.tenantId === tenant.id);
  const tenantCampaigns = campaigns.filter((campaign) => campaign.tenantId === tenant.id);
  const tenantUsers = users.filter((user) => user.tenantId === tenant.id);

  return [
    tenant.id,
    tenant.name,
    tenant.domain,
    tenant.billingCode,
    ...tenant.adminUsernames,
    ...tenantDids.map((did) => did.number),
    ...tenantCampaigns.map((campaign) => campaign.name),
    ...tenantUsers.map((user) => user.username),
  ].some((value) => value.toLowerCase().includes(lower));
};

const filterTenants = (filters: TenantListFilters) => {
  return tenants.filter((tenant) => {
    if (filters.q && !searchTenant(tenant, filters.q)) return false;
    if (filters.status && filters.status !== "all" && tenant.status !== filters.status) return false;
    if (typeof filters.licenseMin === "number" && tenant.licenseSeats < filters.licenseMin) return false;
    if (typeof filters.licenseMax === "number" && tenant.licenseSeats > filters.licenseMax) return false;
    if (filters.createdFrom && tenant.createdAt < filters.createdFrom) return false;
    if (filters.createdTo && tenant.createdAt > `${filters.createdTo}T23:59:59Z`) return false;
    return true;
  });
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (hasBackendDataSource) {
    return requestBackend<DashboardMetrics>("/api/dashboard-metrics");
  }

  if (hasBridgeDataSource) {
    return getBridge<DashboardMetrics>("/dashboard-metrics");
  }

  if (hasYaxxaApiConfig) {
    try {
      type LicenseSummaryResponse = {
        data: Array<{
          tenant_id: string;
          tenant_name: string;
          active_session?: string;
          sms_session?: string;
          chat_session?: string;
          email_session?: string;
          whatsapp_session?: string;
        }>;
      };

      const [licenseSummary, platformSummary] = await Promise.all([
        postYaxxa<LicenseSummaryResponse>("/getLicenseSummary", {
          ...(YAXXA_API_TENANT_IDS.length > 0 ? { tenant_id: YAXXA_API_TENANT_IDS } : {}),
        }),
        postYaxxa<{ data?: { live_session_data?: { total_session_count?: number | string } } }>("/getPlatformRealtimeData", {}),
      ]);

      const totalAllocatedLicenses = (licenseSummary.data ?? []).reduce((sum, tenant) => {
        const sessions = [
          tenant.active_session,
          tenant.sms_session,
          tenant.chat_session,
          tenant.email_session,
          tenant.whatsapp_session,
        ];
        return sum + sessions.reduce((inner, session) => inner + parseLicensePair(session).total, 0);
      }, 0);

      const totalActiveUsers = (licenseSummary.data ?? []).reduce((sum, tenant) => {
        const sessions = [
          tenant.active_session,
          tenant.sms_session,
          tenant.chat_session,
          tenant.email_session,
          tenant.whatsapp_session,
        ];
        return sum + sessions.reduce((inner, session) => inner + parseLicensePair(session).current, 0);
      }, 0);

      return {
        totalTenants: (licenseSummary.data ?? []).length,
        activeTenants: (licenseSummary.data ?? []).length,
        totalAllocatedLicenses,
        totalActiveUsers: Number(platformSummary.data?.live_session_data?.total_session_count ?? totalActiveUsers),
        totalAllocatedDids: 0,
        unassignedDids: 0,
        totalCampaigns: 0,
        source: "yaxxa-api",
      };
    } catch {
      // Fall back to mock data when token/CORS/endpoint issues prevent browser access.
    }
  }

  await delay();
  return {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((tenant) => tenant.status === "active").length,
    totalAllocatedLicenses: tenants.reduce((sum, tenant) => sum + tenant.licenseSeats, 0),
    totalActiveUsers: tenants.reduce((sum, tenant) => sum + tenant.activeUsers, 0),
    totalAllocatedDids: dids.filter((did) => did.tenantId).length,
    unassignedDids: dids.filter((did) => !did.tenantId && did.status === "free").length,
    totalCampaigns: campaigns.length,
    source: "mock",
  };
}

export async function authenticatePortalUser(input: { username: string; password: string }): Promise<AuthSession> {
  if (hasBackendAuth) {
    return requestBackend<AuthSession>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  await delay(300);
  const user = portalUsers.find(
    (entry) =>
      entry.username.toLowerCase() === input.username.trim().toLowerCase() &&
      entry.password === input.password &&
      entry.status === "active",
  );

  if (!user) {
    throw new Error("Invalid username or password");
  }

  user.lastLoginAt = new Date().toISOString();

  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export async function getCurrentPortalSession(): Promise<AuthSession | null> {
  if (!hasBackendAuth) return null;

  try {
    return await requestBackend<AuthSession>("/api/auth/me");
  } catch {
    return null;
  }
}

export async function logoutPortalUser(): Promise<void> {
  if (!hasBackendAuth) return;
  await requestBackend<void>("/api/auth/logout", { method: "POST" });
}

export async function getPortalUsers(): Promise<PortalUserAccount[]> {
  if (hasBackendAuth) {
    return requestBackend<PortalUserAccount[]>("/api/admin/users");
  }

  await delay(200);
  return [...portalUsers];
}

export async function createPortalUser(input: CreatePortalUserInput): Promise<PortalUserAccount> {
  if (hasBackendAuth) {
    return requestBackend<PortalUserAccount>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  await delay(300);
  const usernameTaken = portalUsers.some((user) => user.username.toLowerCase() === input.username.toLowerCase());
  const emailTaken = portalUsers.some((user) => user.email.toLowerCase() === input.email.toLowerCase());

  if (usernameTaken) throw new Error("That username already exists.");
  if (emailTaken) throw new Error("That email address already exists.");

  const newUser: PortalUserAccount = {
    id: `PORTAL-${portalUsers.length + 1}`,
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    password: input.password,
    role: input.role,
    status: "active",
    createdAt: new Date().toISOString(),
    lastLoginAt: "Never",
  };

  portalUsers = [newUser, ...portalUsers];
  return newUser;
}

export async function updatePortalUser(id: string, input: UpdatePortalUserInput): Promise<PortalUserAccount> {
  if (hasBackendAuth) {
    return requestBackend<PortalUserAccount>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  await delay(250);
  const user = portalUsers.find((entry) => entry.id === id);
  if (!user) throw new Error("Portal user not found.");

  const usernameTaken = portalUsers.some(
    (entry) => entry.id !== id && entry.username.toLowerCase() === input.username.toLowerCase(),
  );
  const emailTaken = portalUsers.some(
    (entry) => entry.id !== id && entry.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (usernameTaken) throw new Error("That username already exists.");
  if (emailTaken) throw new Error("That email address already exists.");

  user.fullName = input.fullName;
  user.username = input.username;
  user.email = input.email;
  user.role = input.role;
  return user;
}

export async function resetPortalUserPassword(id: string, password: string): Promise<void> {
  if (hasBackendAuth) {
    return requestBackend<void>(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  await delay(250);
  const user = portalUsers.find((entry) => entry.id === id);
  if (!user) throw new Error("Portal user not found.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  user.password = password;
}

export async function setPortalUserStatus(id: string, status: UserStatus): Promise<PortalUserAccount> {
  if (hasBackendAuth) {
    return requestBackend<PortalUserAccount>(`/api/admin/users/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  await delay(250);
  const user = portalUsers.find((entry) => entry.id === id);
  if (!user) throw new Error("Portal user not found.");

  if (user.role === "admin" && status === "disabled") {
    const otherActiveAdmins = portalUsers.filter(
      (entry) => entry.id !== id && entry.role === "admin" && entry.status === "active",
    );
    if (otherActiveAdmins.length === 0) {
      throw new Error("At least one active admin account must remain.");
    }
  }

  user.status = status;
  return user;
}

export async function deletePortalUser(id: string): Promise<void> {
  if (hasBackendAuth) {
    return requestBackend<void>(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  await delay(250);
  const user = portalUsers.find((entry) => entry.id === id);
  if (!user) throw new Error("Portal user not found.");

  if (user.role === "admin") {
    const otherActiveAdmins = portalUsers.filter(
      (entry) => entry.id !== id && entry.role === "admin" && entry.status === "active",
    );
    if (otherActiveAdmins.length === 0) {
      throw new Error("At least one active admin account must remain.");
    }
  }

  portalUsers = portalUsers.filter((entry) => entry.id !== id);
}

export async function getRecentChanges(limit = 10): Promise<AuditEvent[]> {
  await delay();
  return auditEvents.slice(0, limit);
}

export async function getTenants(filters: TenantListFilters = {}): Promise<PaginatedResult<Tenant>> {
  if (hasBackendDataSource) {
    return requestBackend<PaginatedResult<Tenant>>(
      `/api/tenants${toQueryString({
        q: filters.q,
        status: filters.status,
        licenseMin: filters.licenseMin,
        licenseMax: filters.licenseMax,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 8,
      })}`,
    );
  }

  if (hasBridgeDataSource) {
    return getBridge<PaginatedResult<Tenant>>(
      `/tenants${toQueryString({
        q: filters.q,
        status: filters.status,
        licenseMin: filters.licenseMin,
        licenseMax: filters.licenseMax,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 8,
      })}`,
    );
  }

  if (hasYaxxaApiConfig) {
    try {
      type LicenseSummaryResponse = {
        data: Array<{
          tenant_id: string;
          tenant_name: string;
          active_session?: string;
          sms_session?: string;
          chat_session?: string;
          email_session?: string;
          whatsapp_session?: string;
        }>;
      };

      const response = await postYaxxa<LicenseSummaryResponse>("/getLicenseSummary", {
        ...(YAXXA_API_TENANT_IDS.length > 0 ? { tenant_id: YAXXA_API_TENANT_IDS } : {}),
      });

      const liveTenants: Tenant[] = (response.data ?? []).map((item) => {
        const voice = parseLicensePair(item.active_session);
        const email = parseLicensePair(item.email_session);
        const chat = parseLicensePair(item.chat_session);
        const whatsapp = parseLicensePair(item.whatsapp_session);
        const licenseSeats = voice.total + email.total + chat.total + whatsapp.total;
        const licenseInUse = voice.current + email.current + chat.current + whatsapp.current;

        return {
          id: item.tenant_id,
          name: item.tenant_name,
          domain: `${item.tenant_name.toLowerCase().replace(/\s+/g, "-")}.yaxxa.live`,
          billingCode: item.tenant_id,
          accountManager: "From Yaxxa API",
          createdAt: new Date().toISOString(),
          status: "active",
          notes: "Live tenant data sourced from getLicenseSummary. Other fields use portal fallbacks until documented endpoints are available.",
          dialplanTemplate: "Unknown",
          profileTemplate: "Unknown",
          licenseSeats,
          licenseInUse,
          peakConcurrentAgents: [licenseInUse, licenseInUse, licenseInUse, licenseInUse, licenseInUse, licenseInUse, licenseInUse],
          activeUsers: licenseInUse,
          totalUsers: licenseSeats,
          didsAllocated: 0,
          campaignsActive: 0,
          campaignsTotal: 0,
          queueCount: 0,
          apiStatus: "connected",
          lastSyncAt: new Date().toISOString(),
          apiTokenMasked: "live-api",
          integrationFlags: { crmSync: false, wallboard: true, billingHook: false, speechAnalytics: false },
          channels: {
            voice: voice.total > 0,
            email: email.total > 0,
            whatsapp: whatsapp.total > 0,
            chat: chat.total > 0,
          },
          healthScore: 80,
          adminUsernames: [],
        };
      });

      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 8;
      const filtered = liveTenants.filter((tenant) => {
        if (filters.q && !searchTenant(tenant, filters.q)) return false;
        if (filters.status && filters.status !== "all" && tenant.status !== filters.status) return false;
        return true;
      });
      const start = (page - 1) * pageSize;
      return {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page,
        pageSize,
      };
    } catch {
      // Fall back to mock.
    }
  }

  await delay();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 8;
  const filtered = filterTenants(filters).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getTenantById(id: string): Promise<Tenant> {
  if (hasBackendDataSource) {
    return requestBackend<Tenant>(`/api/tenants/${id}`);
  }

  if (hasBridgeDataSource) {
    return getBridge<Tenant>(`/tenants/${id}`);
  }

  await delay();
  const tenant = tenants.find((item) => item.id === id);
  if (!tenant) throw new Error("Tenant not found");
  return tenant;
}

export async function getTenantUsers(id: string): Promise<TenantUser[]> {
  if (hasBackendDataSource) {
    return requestBackend<TenantUser[]>(`/api/tenants/${id}/users`);
  }

  if (hasBridgeDataSource) {
    return getBridge<TenantUser[]>(`/tenants/${id}/users`);
  }

  await delay();
  return users.filter((user) => user.tenantId === id);
}

export async function getTenantCampaigns(id: string): Promise<TenantCampaign[]> {
  if (hasBackendDataSource) {
    return requestBackend<TenantCampaign[]>(`/api/tenants/${id}/campaigns`);
  }

  if (hasBridgeDataSource) {
    return getBridge<TenantCampaign[]>(`/tenants/${id}/campaigns`);
  }

  await delay();
  return campaigns.filter((campaign) => campaign.tenantId === id);
}

export async function getTenantDids(id: string): Promise<DidRecord[]> {
  if (hasBackendDataSource) {
    return requestBackend<DidRecord[]>(`/api/tenants/${id}/dids`);
  }

  if (hasBridgeDataSource) {
    return getBridge<DidRecord[]>(`/tenants/${id}/dids`);
  }

  await delay();
  return dids.filter((did) => did.tenantId === id);
}

export async function getTenantAudit(id: string): Promise<AuditEvent[]> {
  if (hasBackendDataSource) {
    return [];
  }

  if (hasBridgeDataSource) {
    return [];
  }

  await delay();
  return auditEvents.filter((event) => event.tenantId === id);
}

export async function updateTenantStatus(id: string, status: TenantStatus): Promise<Tenant> {
  assertMutablePortal();
  await delay();
  const tenant = tenants.find((item) => item.id === id);
  if (!tenant) throw new Error("Tenant not found");
  const previous = tenant.status;
  tenant.status = status;
  addAudit({
    id: `AUD-${auditEvents.length + 1}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    action: status === "suspended" ? "tenant.suspended" : "tenant.activated",
    actor: "portal.ops",
    details: `${tenant.name} status changed from ${previous} to ${status}.`,
    previousValue: previous,
    newValue: status,
    createdAt: new Date().toISOString(),
  });
  return tenant;
}

export async function getDids(filters: DidFilters = {}): Promise<DidRecord[]> {
  if (hasBackendDataSource) {
    const results = await requestBackend<DidRecord[]>(
      `/api/dids${toQueryString({
        q: filters.q,
        provider: filters.provider,
        tenantId: filters.tenantId,
      })}`,
    );

    return results.filter((did) => {
      if (filters.country && did.country !== filters.country) return false;
      if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(did.status)) return false;
      if (filters.assignment === "assigned" && !did.tenantId) return false;
      if (filters.assignment === "unassigned" && did.tenantId) return false;
      return true;
    });
  }

  if (hasBridgeDataSource) {
    const results = await getBridge<DidRecord[]>(
      `/dids${toQueryString({
        q: filters.q,
        provider: filters.provider,
        tenantId: filters.tenantId,
      })}`,
    );

    return results.filter((did) => {
      if (filters.country && did.country !== filters.country) return false;
      if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(did.status)) return false;
      if (filters.assignment === "assigned" && !did.tenantId) return false;
      if (filters.assignment === "unassigned" && did.tenantId) return false;
      return true;
    });
  }

  await delay();
  return dids.filter((did) => {
    if (filters.q && !did.number.includes(filters.q)) return false;
    if (filters.provider && did.provider !== filters.provider) return false;
    if (filters.tenantId && did.tenantId !== filters.tenantId) return false;
    if (filters.country && did.country !== filters.country) return false;
    if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(did.status)) return false;
    if (filters.assignment === "assigned" && !did.tenantId) return false;
    if (filters.assignment === "unassigned" && did.tenantId) return false;
    return true;
  });
}

export async function assignDid(input: { didIds: string[]; tenantId: string; campaignId?: string }): Promise<void> {
  assertMutablePortal();
  await delay();
  const tenant = tenants.find((item) => item.id === input.tenantId);
  if (!tenant) throw new Error("Tenant not found");
  const campaign = input.campaignId ? campaigns.find((item) => item.id === input.campaignId) : null;

  dids = dids.map((did) => {
    if (!input.didIds.includes(did.id)) return did;
    return {
      ...did,
      tenantId: tenant.id,
      tenantName: tenant.name,
      campaignId: campaign?.id ?? null,
      campaignName: campaign?.name ?? null,
      status: "active",
    };
  });
  refreshTenantDerivedStats(tenant.id);
  addAudit({
    id: `AUD-${auditEvents.length + 1}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    action: "did.assigned",
    actor: "portal.ops",
    details: `Assigned ${input.didIds.length} DID(s) to ${tenant.name}.`,
    previousValue: "free",
    newValue: campaign ? `${tenant.name} / ${campaign.name}` : tenant.name,
    createdAt: new Date().toISOString(),
  });
}

export async function releaseDid(didId: string): Promise<void> {
  assertMutablePortal();
  await delay();
  const did = dids.find((item) => item.id === didId);
  if (!did) throw new Error("DID not found");
  const tenantId = did.tenantId;
  const previousLabel = did.tenantName ?? "assigned";
  did.tenantId = null;
  did.tenantName = null;
  did.campaignId = null;
  did.campaignName = null;
  did.status = "free";
  if (tenantId) refreshTenantDerivedStats(tenantId);
  addAudit({
    id: `AUD-${auditEvents.length + 1}`,
    tenantId,
    tenantName: did.tenantName,
    action: "did.released",
    actor: "portal.ops",
    details: `Released DID ${did.number}.`,
    previousValue: previousLabel,
    newValue: "free",
    createdAt: new Date().toISOString(),
  });
}

export async function quarantineDid(didId: string): Promise<void> {
  assertMutablePortal();
  await delay();
  const did = dids.find((item) => item.id === didId);
  if (!did) throw new Error("DID not found");
  did.status = "quarantined";
  did.campaignId = null;
  did.campaignName = null;
  addAudit({
    id: `AUD-${auditEvents.length + 1}`,
    tenantId: did.tenantId,
    tenantName: did.tenantName,
    action: "did.quarantined",
    actor: "fraud.monitor",
    details: `Quarantined DID ${did.number}.`,
    previousValue: "active",
    newValue: "quarantined",
    createdAt: new Date().toISOString(),
  });
}

export async function addDidRange(input: { start: string; end: string; provider: string; country: string }): Promise<void> {
  assertMutablePortal();
  await delay();
  const startNum = Number(input.start.replace(/\D/g, ""));
  const endNum = Number(input.end.replace(/\D/g, ""));
  for (let current = startNum; current <= endNum; current += 1) {
    dids.push({
      id: `DID-${dids.length + 1}`,
      number: `+${current}`,
      provider: input.provider,
      trunk: `${input.provider}-AUTO`,
      tenantId: null,
      tenantName: null,
      campaignId: null,
      campaignName: null,
      status: "free",
      country: input.country,
      prefix: `+${String(current).slice(0, 2)}`,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function createTenant(payload: CreateTenantInput): Promise<Tenant> {
  assertMutablePortal();
  await delay(500);
  const tenant: Tenant = {
    id: payload.tenantId,
    name: payload.companyName,
    domain: payload.domain,
    billingCode: payload.billingCode,
    accountManager: payload.accountManager,
    createdAt: new Date().toISOString(),
    status: "active",
    notes: payload.notes,
    dialplanTemplate: payload.dialplanTemplate,
    profileTemplate: payload.profileTemplate,
    licenseSeats: payload.licenseSeats,
    licenseInUse: 1,
    peakConcurrentAgents: [0, 0, 0, 0, 1, 1, 1],
    activeUsers: 1,
    totalUsers: 1,
    didsAllocated: 0,
    campaignsActive: payload.createDefaultCampaign ? 1 : 0,
    campaignsTotal: payload.createDefaultCampaign ? 1 : 0,
    queueCount: payload.createDefaultCampaign ? 1 : 0,
    apiStatus: "connected",
    lastSyncAt: new Date().toISOString(),
    apiTokenMasked: "hodu_live_****************new1",
    integrationFlags: { crmSync: false, wallboard: true, billingHook: true, speechAnalytics: false },
    channels: payload.channels,
    healthScore: 78,
    adminUsernames: [payload.adminUsername],
  };

  tenants = [tenant, ...tenants];
  users = [
    {
      id: `${tenant.id}-USR-1`,
      tenantId: tenant.id,
      username: payload.adminUsername,
      email: payload.adminEmail,
      role: payload.adminRole,
      lastLogin: new Date().toISOString(),
      status: "active",
      consumesLicense: true,
    },
    ...users,
  ];

  if (payload.createDefaultCampaign && payload.campaignName && payload.campaignType) {
    campaigns = [
      {
        id: `${tenant.id}-CMP-1`,
        tenantId: tenant.id,
        name: payload.campaignName,
        type: payload.campaignType,
        status: "active",
        agentsAssigned: 1,
        dialerType: payload.campaignType === "power" ? "power" : "progressive",
        recentActivityAt: new Date().toISOString(),
        didIds: payload.initialDidId ? [payload.initialDidId] : [],
      },
      ...campaigns,
    ];
  }

  if (payload.initialDidId) {
    await assignDid({
      didIds: [payload.initialDidId],
      tenantId: tenant.id,
      campaignId: payload.createDefaultCampaign ? `${tenant.id}-CMP-1` : undefined,
    });
  }

  addAudit({
    id: `AUD-${auditEvents.length + 1}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    action: "tenant.created",
    actor: "portal.ops",
    details: `Created tenant ${tenant.name}.`,
    previousValue: "not provisioned",
    newValue: "active",
    createdAt: new Date().toISOString(),
  });
  return tenant;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  if (hasBackendDataSource) {
    const tenantResult = await getTenants({ page: 1, pageSize: 500 });
    const liveTenants = tenantResult.items;
    const allDids = await getDids({});

    return {
      nearCapTenants: liveTenants
        .map((tenant) => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          allocated: tenant.licenseSeats,
          inUse: tenant.licenseInUse,
          utilization: Math.round((tenant.licenseInUse / Math.max(tenant.licenseSeats, 1)) * 100),
        }))
        .filter((tenant) => tenant.utilization >= 90)
        .sort((a, b) => b.utilization - a.utilization),
      unmappedDids: allDids.filter((did) => !did.provider || !did.trunk).slice(0, 100),
      inactiveCampaigns: [],
      tenantsWithZeroActiveAdmins: liveTenants.filter((tenant) => tenant.activeUsers === 0),
      apiFailures: [],
      overallHealth: liveTenants.some((tenant) => tenant.apiStatus === "error") ? "warning" : "healthy",
    };
  }

  if (hasBridgeDataSource) {
    const tenantResult = await getTenants({ page: 1, pageSize: 500 });
    const liveTenants = tenantResult.items;
    const allDids = await getDids({});

    return {
      nearCapTenants: liveTenants
        .map((tenant) => ({
          tenantId: tenant.id,
          tenantName: tenant.name,
          allocated: tenant.licenseSeats,
          inUse: tenant.licenseInUse,
          utilization: Math.round((tenant.licenseInUse / Math.max(tenant.licenseSeats, 1)) * 100),
        }))
        .filter((tenant) => tenant.utilization >= 90)
        .sort((a, b) => b.utilization - a.utilization),
      unmappedDids: allDids.filter((did) => !did.provider || !did.trunk).slice(0, 100),
      inactiveCampaigns: [],
      tenantsWithZeroActiveAdmins: liveTenants.filter((tenant) => tenant.activeUsers === 0),
      apiFailures: [],
      overallHealth: liveTenants.some((tenant) => tenant.apiStatus === "error") ? "warning" : "healthy",
    };
  }

  await delay();
  const nearCapTenants = tenants
    .map((tenant) => ({
      tenantId: tenant.id,
      tenantName: tenant.name,
      allocated: tenant.licenseSeats,
      inUse: tenant.licenseInUse,
      utilization: Math.round((tenant.licenseInUse / Math.max(tenant.licenseSeats, 1)) * 100),
    }))
    .filter((tenant) => tenant.utilization >= 90);

  const inactiveCampaigns = campaigns.filter((campaign) => {
    const days = (Date.now() - Date.parse(campaign.recentActivityAt)) / 86_400_000;
    return days >= 30;
  });

  const tenantsWithZeroActiveAdmins = tenants.filter((tenant) => {
    const activeAdmins = users.filter(
      (user) => user.tenantId === tenant.id && user.status === "active" && user.role === "tenant_admin",
    );
    return activeAdmins.length === 0;
  });

  const apiFailures = auditEvents.filter((event) => event.action === "integration.sync_failed").slice(0, 6);
  const overallHealth = apiFailures.length > 3 || tenantsWithZeroActiveAdmins.length > 0 ? "critical" : nearCapTenants.length > 0 ? "warning" : "healthy";

  return {
    nearCapTenants,
    unmappedDids: dids.filter((did) => !did.provider || !did.trunk),
    inactiveCampaigns,
    tenantsWithZeroActiveAdmins,
    apiFailures,
    overallHealth,
  };
}

export async function getPortalMeta() {
  if (hasBackendDataSource) {
    const [tenantResult, liveDids] = await Promise.all([
      getTenants({ page: 1, pageSize: 500 }),
      getDids({ assignment: "unassigned" }),
    ]);

    return {
      accountManagers,
      dialplanTemplates,
      profileTemplates,
      tenants: tenantResult.items,
      unassignedDids: liveDids,
      hasLiveYaxxaApiConfig: false,
      dataSource: "backend" as const,
      isReadOnlyLiveData: true,
    };
  }

  if (hasBridgeDataSource) {
    const [tenantResult, liveDids] = await Promise.all([
      getTenants({ page: 1, pageSize: 500 }),
      getDids({ assignment: "unassigned" }),
    ]);

    return {
      accountManagers,
      dialplanTemplates,
      profileTemplates,
      tenants: tenantResult.items,
      unassignedDids: liveDids,
      hasLiveYaxxaApiConfig: false,
      dataSource: "db-bridge" as const,
      isReadOnlyLiveData: true,
    };
  }

  await delay(100);
  return {
    accountManagers,
    dialplanTemplates,
    profileTemplates,
    tenants,
    unassignedDids: dids.filter((did) => !did.tenantId && did.status === "free"),
    hasLiveYaxxaApiConfig: hasYaxxaApiConfig,
    dataSource: hasYaxxaApiConfig ? ("yaxxa-api" as const) : ("mock" as const),
    isReadOnlyLiveData: false,
  };
}
