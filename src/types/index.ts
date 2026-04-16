// ============================================================
// Portal Types — HoduCC / Yaxxa Omni Tenant Portal
// ============================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PROVISIONING_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'READ_ONLY'
  | 'FINANCE_VIEWER';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TEST' | 'DECOMMISSIONED';

export type DIDStatus = 'UNASSIGNED' | 'ASSIGNED' | 'RESERVED' | 'QUARANTINED';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'ARCHIVED';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'SUSPENDED';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface PortalUser {
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

// ============================================================
// Data Source Types
// ============================================================
export type DataSourceType = 'rest_api' | 'graphql' | 'database' | 'mock';

export type DataSourceStatus = 'connected' | 'disconnected' | 'testing' | 'error';

export interface DataSourceAuth {
  type: 'none' | 'bearer' | 'basic' | 'api_key' | 'oauth2';
  token?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scopes: string[];
  };
}

export interface DataSourceEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  entity: 'tenants' | 'dids' | 'users' | 'campaigns' | 'licenses' | 'audit' | 'dashboard';
  responsePath?: string; // JSON path to data (e.g., "data.results")
  isEnabled: boolean;
}

export interface DatabaseConnection {
  type: 'postgresql' | 'mysql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  schema?: string;
  readOnly: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  description: string;
  baseUrl?: string;
  auth: DataSourceAuth;
  endpoints: DataSourceEndpoint[];
  database?: DatabaseConnection;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  isActive: boolean;
  status: DataSourceStatus;
  lastTested?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceTestResult {
  success: boolean;
  message: string;
  latency?: number;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'date_format' | 'boolean' | 'number';
  defaultValue?: string;
}

export interface EntityMapping {
  entity: string;
  sourceEndpoint: string;
  fieldMappings: FieldMapping[];
}

// ============================================================
// Existing Types
// ============================================================
export interface DashboardSummary {
  total_tenants: number;
  active_tenants: number;
  licenses_allocated: number;
  active_users: number;
  total_dids: number;
  unassigned_dids: number;
  campaigns_total: number;
  tenants_near_license_cap: number;
  last_sync: string;
}

export interface CachedTenantSummary {
  tenant: string;
  tenant_name: string;
  status: TenantStatus;
  licenses_allocated: number;
  licenses_in_use: number;
  active_users: number;
  total_users: number;
  dids_allocated: number;
  campaigns_total: number;
  campaigns_active: number;
  last_activity_at: string;
  sync_status: string;
  last_synced_at: string;
}

export interface TenantMetadata {
  tenant_id: string;
  tenant_name: string;
  customer_code: string | null;
  status: TenantStatus;
  internal_owner: string | null;
  timezone: string;
  environment: string | null;
  notes: string | null;
  summary: CachedTenantSummary | null;
  created_at: string;
  updated_at: string;
}

export interface TenantDetail extends TenantMetadata {
  license_allocations: LicenseAllocation[];
  dids: DIDInventory[];
  tenant_notes: TenantNote[];
}

export interface LicenseAllocation {
  id: number;
  tenant: string;
  license_type: string;
  allocated_count: number;
  effective_from: string | null;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DIDInventory {
  id: number;
  did_number: string;
  cli_number: string | null;
  provider_name: string | null;
  trunk_name: string | null;
  status: DIDStatus;
  tenant: string | null;
  tenant_name: string | null;
  assigned_at: string | null;
  unassigned_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantNote {
  id: number;
  tenant: string;
  note_text: string;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  request_id: string | null;
  tenant: string | null;
  tenant_name: string | null;
  entity_type: string;
  entity_id: string | null;
  action_type: string;
  actor_user: number | null;
  actor_username: string | null;
  status: AuditStatus;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  message: string | null;
  created_at: string;
}

export interface TenantUser {
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  status: UserStatus;
  last_login: string | null;
  consumes_license: boolean;
}

export interface TenantCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_status: CampaignStatus;
  campaign_type: string;
  active_agents: number;
  linked_dids: number;
  last_activity_at: string | null;
}

export interface RecentActivity {
  id: number;
  type: 'TENANT_CREATE' | 'DID_ASSIGN' | 'DID_UNASSIGN' | 'LICENSE_UPDATE' | 'METADATA_UPDATE';
  tenant_id: string;
  tenant_name: string;
  actor: string;
  message: string;
  status: AuditStatus;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

// Form types
export interface CreateTenantFormData {
  tenant_name: string;
  customer_code: string;
  status: TenantStatus;
  timezone: string;
  environment: string;
  license_allocation: number;
  full_name: string;
  admin_username: string;
  admin_email: string;
  admin_role: string;
  campaign_template: string;
  queue_template: string;
  did_numbers: string[];
  notes: string;
  internal_owner: string;
}

export interface DIDAssignFormData {
  tenant_id: string;
  did_numbers: string[];
}

// ============================================================
// User & Role Types
// ============================================================
export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role_code: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface CreateUserData {
  username: string;
  full_name: string;
  email: string;
  password: string;
  role_code: string;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  password?: string;
  role_code?: string;
  is_active?: boolean;
}

export interface CreateRoleData {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}
