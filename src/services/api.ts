// ============================================================
// API Service — Simulates the backend API layer
// Replace with real API calls when backend is ready
// ============================================================

import type {
  TenantMetadata,
  TenantDetail,
  DIDInventory,
  AuditLogEntry,
  DashboardSummary,
  RecentActivity,
  TenantUser,
  TenantCampaign,
  TenantNote,
  PaginatedResponse,
  CreateTenantFormData,
  User,
  Role,
  CreateUserData,
  UpdateUserData,
  CreateRoleData,
} from '../types';

import {
  tenants,
  dids,
  auditLogs,
  dashboardSummary,
  recentActivity,
  tenantUsers,
  tenantCampaigns,
  tenantNotes,
} from '../data/mockData';

// Simulate async delay
const delay = (ms: number = 300) => new Promise(r => setTimeout(r, ms));

// ============================================================
// Dashboard
// ============================================================
export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay(200);
  return dashboardSummary;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  await delay(200);
  return recentActivity;
}

// ============================================================
// Tenants
// ============================================================
export async function getTenants(params?: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<TenantMetadata>> {
  await delay(300);
  let filtered = [...tenants];

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.tenant_id.toLowerCase().includes(q) ||
        t.tenant_name.toLowerCase().includes(q) ||
        (t.customer_code?.toLowerCase().includes(q) ?? false)
    );
  }
  if (params?.status) {
    filtered = filtered.filter(t => t.status === params.status);
  }

  const page = params?.page ?? 1;
  const size = params?.page_size ?? 20;
  const start = (page - 1) * size;
  const results = filtered.slice(start, start + size);

  return { count: filtered.length, results };
}

export async function getTenantDetail(tenantId: string): Promise<TenantDetail> {
  await delay(300);
  const tenant = tenants.find(t => t.tenant_id === tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const licenseAllocations = [
    {
      id: 1,
      tenant: tenantId,
      license_type: 'AGENT',
      allocated_count: tenant.summary?.licenses_allocated ?? 0,
      effective_from: null,
      effective_to: null,
      notes: 'Initial allocation',
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
    },
  ];

  const tenantDids = dids.filter(d => d.tenant === tenantId);
  const notes = tenantNotes.filter(n => n.tenant === tenantId);

  return {
    ...tenant,
    license_allocations: licenseAllocations,
    dids: tenantDids,
    tenant_notes: notes,
  };
}

export async function getTenantUsers(_tenantId: string): Promise<TenantUser[]> {
  await delay(200);
  return tenantUsers;
}

export async function getTenantCampaigns(_tenantId: string): Promise<TenantCampaign[]> {
  await delay(200);
  return tenantCampaigns;
}

export async function getTenantNotes(tenantId: string): Promise<TenantNote[]> {
  await delay(200);
  return tenantNotes.filter(n => n.tenant === tenantId);
}

export async function createTenantNote(tenantId: string, noteText: string): Promise<TenantNote> {
  await delay(200);
  const newNote: TenantNote = {
    id: tenantNotes.length + 1,
    tenant: tenantId,
    note_text: noteText,
    created_by: 1,
    created_by_username: 'sarah.mitchell',
    created_at: new Date().toISOString(),
  };
  return newNote;
}

export async function createTenant(_data: CreateTenantFormData): Promise<{ tenant_id: string; status: string; message: string }> {
  await delay(500);
  return {
    tenant_id: '1013',
    status: 'CREATED',
    message: 'Tenant created successfully (simulated)',
  };
}

// ============================================================
// DIDs
// ============================================================
export async function getDIDs(params?: {
  search?: string;
  tenant_id?: string;
  provider?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<DIDInventory>> {
  await delay(300);
  let filtered = [...dids];

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      d =>
        d.did_number.toLowerCase().includes(q) ||
        (d.cli_number?.toLowerCase().includes(q) ?? false)
    );
  }
  if (params?.tenant_id) {
    filtered = filtered.filter(d => d.tenant === params.tenant_id);
  }
  if (params?.provider) {
    filtered = filtered.filter(d => d.provider_name?.toLowerCase().includes(params.provider!.toLowerCase()));
  }
  if (params?.status) {
    filtered = filtered.filter(d => d.status === params.status);
  }

  const page = params?.page ?? 1;
  const size = params?.page_size ?? 20;
  const start = (page - 1) * size;
  const results = filtered.slice(start, start + size);

  return { count: filtered.length, results };
}

export async function assignDIDs(_tenantId: string, _didNumbers: string[]): Promise<{ success: boolean; assigned: string[] }> {
  await delay(500);
  return { success: true, assigned: _didNumbers };
}

export async function unassignDIDs(_tenantId: string, _didNumbers: string[]): Promise<{ success: boolean; unassigned: string[] }> {
  await delay(500);
  return { success: true, unassigned: _didNumbers };
}

// ============================================================
// Audit Log
// ============================================================
export async function getAuditLogs(params?: {
  tenant_id?: string;
  action_type?: string;
  entity_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedResponse<AuditLogEntry>> {
  await delay(300);
  let filtered = [...auditLogs];

  if (params?.tenant_id) {
    filtered = filtered.filter(l => l.tenant === params.tenant_id);
  }
  if (params?.action_type) {
    filtered = filtered.filter(l => l.action_type === params.action_type);
  }
  if (params?.entity_type) {
    filtered = filtered.filter(l => l.entity_type === params.entity_type);
  }
  if (params?.status) {
    filtered = filtered.filter(l => l.status === params.status);
  }

  return { count: filtered.length, results: filtered };
}

// ============================================================
// Users & Roles (Mock)
// ============================================================
const mockRoles: Role[] = [
  { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Full access to all portal features', permissions: ['view_dashboard', 'view_tenants', 'create_tenants', 'edit_tenants', 'suspend_tenants', 'view_dids', 'manage_dids', 'view_users', 'manage_users', 'view_audit_log', 'view_finance', 'manage_settings'] },
  { code: 'PROVISIONING_ADMIN', name: 'Provisioning Admin', description: 'Can create and manage tenants and DIDs', permissions: ['view_dashboard', 'view_tenants', 'create_tenants', 'edit_tenants', 'view_dids', 'manage_dids', 'view_users', 'view_audit_log'] },
  { code: 'SUPPORT_ADMIN', name: 'Support Admin', description: 'Can view tenants and provide support', permissions: ['view_dashboard', 'view_tenants', 'edit_tenants', 'view_dids', 'view_users', 'view_audit_log'] },
  { code: 'READ_ONLY', name: 'Read Only', description: 'View-only access to portal data', permissions: ['view_dashboard', 'view_tenants', 'view_dids', 'view_users', 'view_audit_log'] },
  { code: 'FINANCE_VIEWER', name: 'Finance Viewer', description: 'Can view financial data and reports', permissions: ['view_dashboard', 'view_tenants', 'view_finance'] },
];

let mockUsers: User[] = [
  { id: 1, username: 'portaladmin', full_name: 'Portal Administrator', email: 'admin@hoduportal.com', role_code: 'SUPER_ADMIN', is_active: true, last_login: '2026-03-10T09:30:00Z', created_at: '2025-01-15T10:00:00Z', updated_at: '2026-03-10T09:30:00Z' },
  { id: 2, username: 'john.provisioner', full_name: 'John Smith', email: 'john.smith@hoduportal.com', role_code: 'PROVISIONING_ADMIN', is_active: true, last_login: '2026-03-09T14:22:00Z', created_at: '2025-03-20T11:00:00Z', updated_at: '2026-03-09T14:22:00Z' },
  { id: 3, username: 'jane.support', full_name: 'Jane Doe', email: 'jane.doe@hoduportal.com', role_code: 'SUPPORT_ADMIN', is_active: true, last_login: '2026-03-08T16:45:00Z', created_at: '2025-06-10T09:00:00Z', updated_at: '2026-03-08T16:45:00Z' },
  { id: 4, username: 'bob.viewer', full_name: 'Bob Williams', email: 'bob.williams@hoduportal.com', role_code: 'READ_ONLY', is_active: true, last_login: null, created_at: '2025-09-01T08:00:00Z', updated_at: '2025-09-01T08:00:00Z' },
  { id: 5, username: 'sarah.finance', full_name: 'Sarah Johnson', email: 'sarah.johnson@hoduportal.com', role_code: 'FINANCE_VIEWER', is_active: false, last_login: '2026-02-15T10:00:00Z', created_at: '2025-11-05T13:00:00Z', updated_at: '2026-03-01T09:00:00Z' },
];

let nextUserId = 6;

export async function getUsers(): Promise<User[]> {
  await delay(200);
  return [...mockUsers];
}

export async function getUser(id: number): Promise<User | undefined> {
  await delay(100);
  return mockUsers.find(u => u.id === id);
}

export async function createUser(data: CreateUserData): Promise<User> {
  await delay(300);
  if (mockUsers.some(u => u.username === data.username)) {
    throw new Error('Username already exists');
  }
  if (mockUsers.some(u => u.email === data.email)) {
    throw new Error('Email already exists');
  }
  const newUser: User = {
    id: nextUserId++,
    username: data.username,
    full_name: data.full_name,
    email: data.email,
    role_code: data.role_code,
    is_active: true,
    last_login: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  return newUser;
}

export async function updateUser(id: number, data: UpdateUserData): Promise<User> {
  await delay(300);
  const index = mockUsers.findIndex(u => u.id === id);
  if (index === -1) throw new Error('User not found');
  mockUsers[index] = { ...mockUsers[index], ...data, updated_at: new Date().toISOString() };
  return mockUsers[index];
}

export async function deleteUser(id: number): Promise<void> {
  await delay(200);
  const index = mockUsers.findIndex(u => u.id === id);
  if (index === -1) throw new Error('User not found');
  mockUsers.splice(index, 1);
}

export async function getRoles(): Promise<Role[]> {
  await delay(150);
  return [...mockRoles];
}

export async function getRole(code: string): Promise<Role | undefined> {
  await delay(100);
  return mockRoles.find(r => r.code === code);
}

export async function createRole(data: CreateRoleData): Promise<Role> {
  await delay(300);
  if (mockRoles.some(r => r.code === data.code)) {
    throw new Error('Role code already exists');
  }
  const newRole: Role = { ...data };
  mockRoles.push(newRole);
  return newRole;
}

export async function updateRole(code: string, data: Partial<CreateRoleData>): Promise<Role> {
  await delay(300);
  const index = mockRoles.findIndex(r => r.code === code);
  if (index === -1) throw new Error('Role not found');
  mockRoles[index] = { ...mockRoles[index], ...data };
  return mockRoles[index];
}

export async function deleteRole(code: string): Promise<void> {
  await delay(200);
  const index = mockRoles.findIndex(r => r.code === code);
  if (index === -1) throw new Error('Role not found');
  if (mockUsers.some(u => u.role_code === code)) {
    throw new Error('Cannot delete role with assigned users. Reassign users first.');
  }
  mockRoles.splice(index, 1);
}
