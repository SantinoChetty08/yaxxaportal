export type TenantStatus = "active" | "suspended" | "test" | "decommissioned";
export type DidStatus = "free" | "reserved" | "active" | "quarantined";
export type UserStatus = "active" | "disabled";
export type PortalRole = "admin" | "viewer";
export type CampaignStatus = "active" | "paused" | "draft" | "archived";
export type CampaignType = "inbound" | "outbound" | "blended" | "preview" | "power";
export type ApiStatus = "connected" | "error";
export type AuditAction =
  | "tenant.created"
  | "tenant.updated"
  | "tenant.suspended"
  | "tenant.activated"
  | "did.assigned"
  | "did.released"
  | "did.quarantined"
  | "license.updated"
  | "campaign.updated"
  | "integration.sync_failed";

export interface LicenseChannels {
  voice: boolean;
  email: boolean;
  whatsapp: boolean;
  chat: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  billingCode: string;
  accountManager: string;
  createdAt: string;
  status: TenantStatus;
  notes: string;
  dialplanTemplate: string;
  profileTemplate: string;
  licenseSeats: number;
  licenseInUse: number;
  peakConcurrentAgents: number[];
  activeUsers: number;
  totalUsers: number;
  didsAllocated: number;
  campaignsActive: number;
  campaignsTotal: number;
  queueCount: number;
  apiStatus: ApiStatus;
  lastSyncAt: string;
  apiTokenMasked: string;
  integrationFlags: {
    crmSync: boolean;
    wallboard: boolean;
    billingHook: boolean;
    speechAnalytics: boolean;
  };
  channels: LicenseChannels;
  healthScore: number;
  adminUsernames: string[];
}

export interface TenantUser {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  role: "tenant_admin" | "supervisor" | "agent" | "qa";
  lastLogin: string;
  status: UserStatus;
  consumesLicense: boolean;
}

export interface TenantCampaign {
  id: string;
  tenantId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  agentsAssigned: number;
  dialerType: "progressive" | "predictive" | "preview" | "power";
  recentActivityAt: string;
  didIds: string[];
}

export interface DidRecord {
  id: string;
  number: string;
  provider: string | null;
  trunk: string | null;
  tenantId: string | null;
  tenantName: string | null;
  campaignId: string | null;
  campaignName: string | null;
  status: DidStatus;
  country: string;
  prefix: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  action: AuditAction;
  actor: string;
  details: string;
  previousValue: string;
  newValue: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  totalAllocatedLicenses: number;
  totalActiveUsers: number;
  totalAllocatedDids: number;
  unassignedDids: number;
  totalCampaigns: number;
  source?: "mock" | "yaxxa-api" | "db-bridge";
}

export interface TenantListFilters {
  q?: string;
  status?: TenantStatus | "all";
  licenseMin?: number;
  licenseMax?: number;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

export interface DidFilters {
  q?: string;
  provider?: string;
  tenantId?: string;
  statuses?: DidStatus[];
  country?: string;
  assignment?: "all" | "assigned" | "unassigned";
}

export interface CreateTenantInput {
  companyName: string;
  domain: string;
  billingCode: string;
  accountManager: string;
  notes: string;
  tenantId: string;
  dialplanTemplate: string;
  profileTemplate: string;
  licenseSeats: number;
  channels: LicenseChannels;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminRole: "tenant_admin" | "supervisor";
  createDefaultCampaign: boolean;
  campaignName?: string;
  campaignType?: CampaignType;
  initialDidId?: string;
}

export interface AdminDashboardData {
  nearCapTenants: Array<{
    tenantId: string;
    tenantName: string;
    allocated: number;
    inUse: number;
    utilization: number;
  }>;
  unmappedDids: DidRecord[];
  inactiveCampaigns: TenantCampaign[];
  tenantsWithZeroActiveAdmins: Tenant[];
  apiFailures: AuditEvent[];
  overallHealth: "healthy" | "warning" | "critical";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PortalUserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: PortalRole;
  password: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: PortalRole;
}

export interface CreatePortalUserInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: PortalRole;
}

export interface UpdatePortalUserInput {
  fullName: string;
  username: string;
  email: string;
  role: PortalRole;
}
