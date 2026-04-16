import type {
  TenantMetadata,
  DIDInventory,
  AuditLogEntry,
  DashboardSummary,
  RecentActivity,
  TenantUser,
  TenantCampaign,
  TenantNote,
  PortalUser,
} from '../types';

// ============================================================
// Tenants
// ============================================================
export const tenants: TenantMetadata[] = [
  { tenant_id: '1001', tenant_name: 'Acme Contact Centre', customer_code: 'ACME-001', status: 'ACTIVE', internal_owner: 'Sarah Mitchell', timezone: 'Africa/Johannesburg', environment: 'production', notes: 'Primary enterprise customer', created_at: '2025-01-15T09:00:00Z', updated_at: '2026-03-10T08:15:00Z', summary: { tenant: '1001', tenant_name: 'Acme Contact Centre', status: 'ACTIVE', licenses_allocated: 50, licenses_in_use: 41, active_users: 39, total_users: 52, dids_allocated: 12, campaigns_total: 9, campaigns_active: 6, last_activity_at: '2026-03-10T08:10:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1002', tenant_name: 'BlueWave Telecom', customer_code: 'BW-002', status: 'ACTIVE', internal_owner: 'James Naidoo', timezone: 'Africa/Johannesburg', environment: 'production', notes: '', created_at: '2025-02-20T14:00:00Z', updated_at: '2026-03-09T16:30:00Z', summary: { tenant: '1002', tenant_name: 'BlueWave Telecom', status: 'ACTIVE', licenses_allocated: 30, licenses_in_use: 28, active_users: 26, total_users: 31, dids_allocated: 8, campaigns_total: 4, campaigns_active: 3, last_activity_at: '2026-03-09T15:00:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1003', tenant_name: 'CloudPeak Solutions', customer_code: 'CP-003', status: 'ACTIVE', internal_owner: 'Sarah Mitchell', timezone: 'Africa/Nairobi', environment: 'production', notes: 'Multi-region deployment', created_at: '2025-03-10T11:00:00Z', updated_at: '2026-03-10T07:45:00Z', summary: { tenant: '1003', tenant_name: 'CloudPeak Solutions', status: 'ACTIVE', licenses_allocated: 80, licenses_in_use: 72, active_users: 68, total_users: 79, dids_allocated: 20, campaigns_total: 15, campaigns_active: 11, last_activity_at: '2026-03-10T07:30:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1004', tenant_name: 'DigiConnect SA', customer_code: 'DC-004', status: 'SUSPENDED', internal_owner: 'David Okonkwo', timezone: 'Africa/Lagos', environment: 'production', notes: 'Suspended pending payment resolution', created_at: '2025-04-01T10:00:00Z', updated_at: '2026-03-05T09:00:00Z', summary: { tenant: '1004', tenant_name: 'DigiConnect SA', status: 'SUSPENDED', licenses_allocated: 20, licenses_in_use: 0, active_users: 0, total_users: 18, dids_allocated: 5, campaigns_total: 2, campaigns_active: 0, last_activity_at: '2026-02-28T18:00:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1005', tenant_name: 'Eagle Eye Security', customer_code: 'EE-005', status: 'TEST', internal_owner: 'James Naidoo', timezone: 'Africa/Johannesburg', environment: 'staging', notes: 'Test tenant for security product evaluation', created_at: '2025-06-12T08:30:00Z', updated_at: '2026-03-08T12:00:00Z', summary: { tenant: '1005', tenant_name: 'Eagle Eye Security', status: 'TEST', licenses_allocated: 10, licenses_in_use: 3, active_users: 3, total_users: 8, dids_allocated: 2, campaigns_total: 1, campaigns_active: 1, last_activity_at: '2026-03-08T11:00:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1006', tenant_name: 'FlexiCall Solutions', customer_code: 'FC-006', status: 'ACTIVE', internal_owner: 'Sarah Mitchell', timezone: 'Africa/Accra', environment: 'production', notes: '', created_at: '2025-07-22T15:00:00Z', updated_at: '2026-03-10T06:00:00Z', summary: { tenant: '1006', tenant_name: 'FlexiCall Solutions', status: 'ACTIVE', licenses_allocated: 45, licenses_in_use: 44, active_users: 42, total_users: 48, dids_allocated: 15, campaigns_total: 7, campaigns_active: 5, last_activity_at: '2026-03-10T05:45:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1007', tenant_name: 'GreenLine Insurance', customer_code: 'GL-007', status: 'ACTIVE', internal_owner: 'David Okonkwo', timezone: 'Africa/Johannesburg', environment: 'production', notes: 'Insurance claim processing centre', created_at: '2025-08-05T10:00:00Z', updated_at: '2026-03-09T14:30:00Z', summary: { tenant: '1007', tenant_name: 'GreenLine Insurance', status: 'ACTIVE', licenses_allocated: 60, licenses_in_use: 51, active_users: 49, total_users: 62, dids_allocated: 18, campaigns_total: 12, campaigns_active: 9, last_activity_at: '2026-03-09T14:00:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1008', tenant_name: 'HostVoice Kenya', customer_code: 'HV-008', status: 'DECOMMISSIONED', internal_owner: '', timezone: 'Africa/Nairobi', environment: 'production', notes: 'Decommissioned — migrated to new platform', created_at: '2024-03-01T09:00:00Z', updated_at: '2025-12-15T10:00:00Z', summary: { tenant: '1008', tenant_name: 'HostVoice Kenya', status: 'DECOMMISSIONED', licenses_allocated: 0, licenses_in_use: 0, active_users: 0, total_users: 25, dids_allocated: 0, campaigns_total: 0, campaigns_active: 0, last_activity_at: '2025-12-01T17:00:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1009', tenant_name: 'Infinity BPO', customer_code: 'IB-009', status: 'ACTIVE', internal_owner: 'James Naidoo', timezone: 'Africa/Johannesburg', environment: 'production', notes: 'Large BPO — multiple campaigns', created_at: '2025-09-10T13:00:00Z', updated_at: '2026-03-10T07:00:00Z', summary: { tenant: '1009', tenant_name: 'Infinity BPO', status: 'ACTIVE', licenses_allocated: 120, licenses_in_use: 115, active_users: 110, total_users: 125, dids_allocated: 35, campaigns_total: 22, campaigns_active: 18, last_activity_at: '2026-03-10T06:50:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1010', tenant_name: 'Jupiter Financial', customer_code: 'JF-010', status: 'ACTIVE', internal_owner: 'Sarah Mitchell', timezone: 'Africa/Johannesburg', environment: 'production', notes: '', created_at: '2025-10-18T09:30:00Z', updated_at: '2026-03-09T11:00:00Z', summary: { tenant: '1010', tenant_name: 'Jupiter Financial', status: 'ACTIVE', licenses_allocated: 35, licenses_in_use: 30, active_users: 28, total_users: 36, dids_allocated: 10, campaigns_total: 6, campaigns_active: 4, last_activity_at: '2026-03-09T10:30:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1011', tenant_name: 'Kibo Retail', customer_code: 'KR-011', status: 'ACTIVE', internal_owner: 'David Okonkwo', timezone: 'Africa/Nairobi', environment: 'production', notes: 'Retail customer support — seasonal spikes', created_at: '2025-11-02T14:00:00Z', updated_at: '2026-03-10T05:00:00Z', summary: { tenant: '1011', tenant_name: 'Kibo Retail', status: 'ACTIVE', licenses_allocated: 25, licenses_in_use: 22, active_users: 20, total_users: 27, dids_allocated: 7, campaigns_total: 3, campaigns_active: 2, last_activity_at: '2026-03-10T04:30:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
  { tenant_id: '1012', tenant_name: 'Luma Health', customer_code: 'LH-012', status: 'ACTIVE', internal_owner: 'James Naidoo', timezone: 'Africa/Johannesburg', environment: 'production', notes: 'Healthcare — requires compliance monitoring', created_at: '2025-12-01T10:00:00Z', updated_at: '2026-03-09T17:00:00Z', summary: { tenant: '1012', tenant_name: 'Luma Health', status: 'ACTIVE', licenses_allocated: 40, licenses_in_use: 38, active_users: 35, total_users: 42, dids_allocated: 14, campaigns_total: 8, campaigns_active: 6, last_activity_at: '2026-03-09T16:45:00Z', sync_status: 'OK', last_synced_at: '2026-03-10T08:00:00Z' } },
];

// ============================================================
// DIDs
// ============================================================
export const dids: DIDInventory[] = [
  { id: 1, did_number: '+27115550001', cli_number: '+27115550001', provider_name: 'Telkom', trunk_name: 'SIP-Trunk-A', status: 'ASSIGNED', tenant: '1001', tenant_name: 'Acme Contact Centre', assigned_at: '2025-02-01T10:00:00Z', unassigned_at: null, notes: 'Main inbound line', created_at: '2025-01-20T08:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  { id: 2, did_number: '+27115550002', cli_number: '+27115550002', provider_name: 'Telkom', trunk_name: 'SIP-Trunk-A', status: 'ASSIGNED', tenant: '1001', tenant_name: 'Acme Contact Centre', assigned_at: '2025-02-01T10:00:00Z', unassigned_at: null, notes: '', created_at: '2025-01-20T08:00:00Z', updated_at: '2025-02-01T10:00:00Z' },
  { id: 3, did_number: '+27115550003', cli_number: '+27115550003', provider_name: 'Vox', trunk_name: 'SIP-Trunk-B', status: 'ASSIGNED', tenant: '1002', tenant_name: 'BlueWave Telecom', assigned_at: '2025-03-01T09:00:00Z', unassigned_at: null, notes: '', created_at: '2025-02-15T08:00:00Z', updated_at: '2025-03-01T09:00:00Z' },
  { id: 4, did_number: '+27115550004', cli_number: '+27115550004', provider_name: 'Vox', trunk_name: 'SIP-Trunk-B', status: 'UNASSIGNED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: '2025-06-15T14:00:00Z', notes: 'Available for assignment', created_at: '2025-02-15T08:00:00Z', updated_at: '2025-06-15T14:00:00Z' },
  { id: 5, did_number: '+27115550005', cli_number: '+27115550005', provider_name: 'Liquid Telecom', trunk_name: 'SIP-Trunk-C', status: 'ASSIGNED', tenant: '1003', tenant_name: 'CloudPeak Solutions', assigned_at: '2025-04-01T11:00:00Z', unassigned_at: null, notes: 'East Africa regional line', created_at: '2025-03-10T08:00:00Z', updated_at: '2025-04-01T11:00:00Z' },
  { id: 6, did_number: '+27115550006', cli_number: '+27115550006', provider_name: 'Liquid Telecom', trunk_name: 'SIP-Trunk-C', status: 'RESERVED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: 'Reserved for CloudPeak expansion', created_at: '2025-03-10T08:00:00Z', updated_at: '2025-03-10T08:00:00Z' },
  { id: 7, did_number: '+27115550007', cli_number: '+27115550007', provider_name: 'Telkom', trunk_name: 'SIP-Trunk-A', status: 'ASSIGNED', tenant: '1006', tenant_name: 'FlexiCall Solutions', assigned_at: '2025-08-01T10:00:00Z', unassigned_at: null, notes: '', created_at: '2025-07-20T08:00:00Z', updated_at: '2025-08-01T10:00:00Z' },
  { id: 8, did_number: '+27115550008', cli_number: '+27115550008', provider_name: 'MTN', trunk_name: 'SIP-Trunk-D', status: 'QUARANTINED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: '2026-01-10T09:00:00Z', notes: 'Spam complaints — quarantined pending review', created_at: '2025-05-01T08:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
  { id: 9, did_number: '+27115550009', cli_number: '+27115550009', provider_name: 'Vox', trunk_name: 'SIP-Trunk-B', status: 'ASSIGNED', tenant: '1007', tenant_name: 'GreenLine Insurance', assigned_at: '2025-09-01T09:00:00Z', unassigned_at: null, notes: 'Claims department line', created_at: '2025-08-01T08:00:00Z', updated_at: '2025-09-01T09:00:00Z' },
  { id: 10, did_number: '+27115550010', cli_number: '+27115550010', provider_name: 'Liquid Telecom', trunk_name: 'SIP-Trunk-C', status: 'ASSIGNED', tenant: '1009', tenant_name: 'Infinity BPO', assigned_at: '2025-10-01T10:00:00Z', unassigned_at: null, notes: 'Campaign #4 dedicated line', created_at: '2025-09-10T08:00:00Z', updated_at: '2025-10-01T10:00:00Z' },
  { id: 11, did_number: '+27115550011', cli_number: '+27115550011', provider_name: 'MTN', trunk_name: 'SIP-Trunk-D', status: 'UNASSIGNED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: '', created_at: '2025-10-15T08:00:00Z', updated_at: '2025-10-15T08:00:00Z' },
  { id: 12, did_number: '+27115550012', cli_number: '+27115550012', provider_name: 'Telkom', trunk_name: 'SIP-Trunk-A', status: 'UNASSIGNED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: '', created_at: '2025-11-01T08:00:00Z', updated_at: '2025-11-01T08:00:00Z' },
  { id: 13, did_number: '+27115550013', cli_number: '+27115550013', provider_name: 'Vox', trunk_name: 'SIP-Trunk-B', status: 'ASSIGNED', tenant: '1010', tenant_name: 'Jupiter Financial', assigned_at: '2025-11-01T10:00:00Z', unassigned_at: null, notes: '', created_at: '2025-10-18T08:00:00Z', updated_at: '2025-11-01T10:00:00Z' },
  { id: 14, did_number: '+27115550014', cli_number: '+27115550014', provider_name: 'Liquid Telecom', trunk_name: 'SIP-Trunk-C', status: 'ASSIGNED', tenant: '1011', tenant_name: 'Kibo Retail', assigned_at: '2025-11-15T10:00:00Z', unassigned_at: null, notes: '', created_at: '2025-11-02T08:00:00Z', updated_at: '2025-11-15T10:00:00Z' },
  { id: 15, did_number: '+27115550015', cli_number: '+27115550015', provider_name: 'MTN', trunk_name: 'SIP-Trunk-D', status: 'ASSIGNED', tenant: '1012', tenant_name: 'Luma Health', assigned_at: '2025-12-15T10:00:00Z', unassigned_at: null, notes: 'Patient support line', created_at: '2025-12-01T08:00:00Z', updated_at: '2025-12-15T10:00:00Z' },
  { id: 16, did_number: '+27115550016', cli_number: '+27115550016', provider_name: 'Telkom', trunk_name: 'SIP-Trunk-A', status: 'UNASSIGNED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: '', created_at: '2026-01-10T08:00:00Z', updated_at: '2026-01-10T08:00:00Z' },
  { id: 17, did_number: '+27115550017', cli_number: '+27115550017', provider_name: 'Vox', trunk_name: 'SIP-Trunk-B', status: 'UNASSIGNED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: '', created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-01T08:00:00Z' },
  { id: 18, did_number: '+27115550018', cli_number: '+27115550018', provider_name: 'Liquid Telecom', trunk_name: 'SIP-Trunk-C', status: 'RESERVED', tenant: null, tenant_name: null, assigned_at: null, unassigned_at: null, notes: 'Reserved for upcoming enterprise client', created_at: '2026-02-15T08:00:00Z', updated_at: '2026-02-15T08:00:00Z' },
];

// ============================================================
// Tenant Users (for detail view)
// ============================================================
export const tenantUsers: TenantUser[] = [
  { user_id: 'U101', username: 'jane.doe', full_name: 'Jane Doe', role: 'TENANT_ADMIN', status: 'ACTIVE', last_login: '2026-03-10T07:30:00Z', consumes_license: true },
  { user_id: 'U102', username: 'john.smith', full_name: 'John Smith', role: 'AGENT', status: 'ACTIVE', last_login: '2026-03-10T08:00:00Z', consumes_license: true },
  { user_id: 'U103', username: 'alice.wong', full_name: 'Alice Wong', role: 'SUPERVISOR', status: 'ACTIVE', last_login: '2026-03-10T07:45:00Z', consumes_license: true },
  { user_id: 'U104', username: 'bob.jones', full_name: 'Bob Jones', role: 'AGENT', status: 'DISABLED', last_login: '2026-02-20T12:00:00Z', consumes_license: false },
  { user_id: 'U105', username: 'sarah.lee', full_name: 'Sarah Lee', role: 'AGENT', status: 'ACTIVE', last_login: '2026-03-09T16:00:00Z', consumes_license: true },
];

// ============================================================
// Tenant Campaigns (for detail view)
// ============================================================
export const tenantCampaigns: TenantCampaign[] = [
  { campaign_id: 'C001', campaign_name: 'Outbound Sales Q1', campaign_status: 'ACTIVE', campaign_type: 'PREDICTIVE', active_agents: 15, linked_dids: 4, last_activity_at: '2026-03-10T08:00:00Z' },
  { campaign_id: 'C002', campaign_name: 'Customer Retention', campaign_status: 'ACTIVE', campaign_type: 'PREVIEW', active_agents: 8, linked_dids: 2, last_activity_at: '2026-03-10T07:45:00Z' },
  { campaign_id: 'C003', campaign_name: 'Survey Campaign', campaign_status: 'PAUSED', campaign_type: 'DIALER', active_agents: 0, linked_dids: 1, last_activity_at: '2026-03-05T14:00:00Z' },
  { campaign_id: 'C004', campaign_name: 'Collections Follow-up', campaign_status: 'ACTIVE', campaign_type: 'PROGRESSIVE', active_agents: 10, linked_dids: 3, last_activity_at: '2026-03-10T06:30:00Z' },
  { campaign_id: 'C005', campaign_name: 'Welcome Calls', campaign_status: 'DRAFT', campaign_type: 'PREVIEW', active_agents: 0, linked_dids: 0, last_activity_at: null },
];

// ============================================================
// Tenant Notes
// ============================================================
export const tenantNotes: TenantNote[] = [
  { id: 1, tenant: '1001', note_text: 'Customer requested DID range expansion for Q2.', created_by: 1, created_by_username: 'sarah.mitchell', created_at: '2026-03-08T14:00:00Z' },
  { id: 2, tenant: '1001', note_text: 'Licenses at 82% capacity — consider recommending upgrade.', created_by: 2, created_by_username: 'james.naidoo', created_at: '2026-03-05T10:30:00Z' },
  { id: 3, tenant: '1006', note_text: 'Near license cap (44/45). Customer has been notified.', created_by: 1, created_by_username: 'sarah.mitchell', created_at: '2026-03-09T09:00:00Z' },
];

// ============================================================
// Audit Logs
// ============================================================
export const auditLogs: AuditLogEntry[] = [
  { id: 1, request_id: 'req-001', tenant: '1001', tenant_name: 'Acme Contact Centre', entity_type: 'TENANT', entity_id: '1001', action_type: 'TENANT_CREATE', actor_user: 1, actor_username: 'sarah.mitchell', status: 'SUCCESS', before_json: null, after_json: { tenant_id: '1001', tenant_name: 'Acme Contact Centre', license_allocation: 50 }, message: 'Tenant created successfully', created_at: '2025-01-15T09:00:00Z' },
  { id: 2, request_id: 'req-002', tenant: '1001', tenant_name: 'Acme Contact Centre', entity_type: 'DID', entity_id: '+27115550001', action_type: 'DID_ASSIGN', actor_user: 2, actor_username: 'james.naidoo', status: 'SUCCESS', before_json: { status: 'UNASSIGNED' }, after_json: { status: 'ASSIGNED', tenant_id: '1001' }, message: 'Assigned DID +27115550001 to tenant 1001', created_at: '2025-02-01T10:00:00Z' },
  { id: 3, request_id: 'req-003', tenant: '1003', tenant_name: 'CloudPeak Solutions', entity_type: 'LICENSE_ALLOCATION', entity_id: '3', action_type: 'LICENSE_ALLOCATION_UPDATE', actor_user: 1, actor_username: 'sarah.mitchell', status: 'SUCCESS', before_json: { allocated_count: 60 }, after_json: { allocated_count: 80 }, message: 'Updated AGENT allocation for tenant 1003', created_at: '2026-01-15T11:00:00Z' },
  { id: 4, request_id: 'req-004', tenant: '1004', tenant_name: 'DigiConnect SA', entity_type: 'TENANT', entity_id: '1004', action_type: 'TENANT_METADATA_UPDATE', actor_user: 3, actor_username: 'david.okonkwo', status: 'SUCCESS', before_json: { status: 'ACTIVE' }, after_json: { status: 'SUSPENDED' }, message: 'Tenant metadata updated', created_at: '2026-03-05T09:00:00Z' },
  { id: 5, request_id: 'req-005', tenant: '1009', tenant_name: 'Infinity BPO', entity_type: 'DID', entity_id: '+27115550010', action_type: 'DID_ASSIGN', actor_user: 2, actor_username: 'james.naidoo', status: 'SUCCESS', before_json: { status: 'UNASSIGNED' }, after_json: { status: 'ASSIGNED', tenant_id: '1009' }, message: 'Assigned DID +27115550010 to tenant 1009', created_at: '2025-10-01T10:00:00Z' },
  { id: 6, request_id: 'req-006', tenant: '1008', tenant_name: 'HostVoice Kenya', entity_type: 'TENANT', entity_id: '1008', action_type: 'TENANT_METADATA_UPDATE', actor_user: 1, actor_username: 'sarah.mitchell', status: 'SUCCESS', before_json: { status: 'ACTIVE' }, after_json: { status: 'DECOMMISSIONED' }, message: 'Tenant decommissioned — migrated to new platform', created_at: '2025-12-15T10:00:00Z' },
  { id: 7, request_id: 'req-007', tenant: '1006', tenant_name: 'FlexiCall Solutions', entity_type: 'TENANT_NOTE', entity_id: '3', action_type: 'TENANT_NOTE_CREATE', actor_user: 1, actor_username: 'sarah.mitchell', status: 'SUCCESS', before_json: null, after_json: { note_text: 'Near license cap (44/45). Customer has been notified.' }, message: 'Created tenant note', created_at: '2026-03-09T09:00:00Z' },
  { id: 8, request_id: 'req-008', tenant: '1012', tenant_name: 'Luma Health', entity_type: 'DID', entity_id: '+27115550015', action_type: 'DID_ASSIGN', actor_user: 2, actor_username: 'james.naidoo', status: 'SUCCESS', before_json: { status: 'UNASSIGNED' }, after_json: { status: 'ASSIGNED', tenant_id: '1012' }, message: 'Assigned DID +27115550015 to tenant 1012', created_at: '2025-12-15T10:00:00Z' },
];

// ============================================================
// Recent Activity (derived from audit logs for dashboard)
// ============================================================
export const recentActivity: RecentActivity[] = [
  { id: 1, type: 'TENANT_CREATE', tenant_id: '1012', tenant_name: 'Luma Health', actor: 'james.naidoo', message: 'Created tenant Luma Health', status: 'SUCCESS', created_at: '2025-12-01T10:00:00Z' },
  { id: 2, type: 'DID_ASSIGN', tenant_id: '1012', tenant_name: 'Luma Health', actor: 'james.naidoo', message: 'Assigned DID +27115550015', status: 'SUCCESS', created_at: '2025-12-15T10:00:00Z' },
  { id: 3, type: 'METADATA_UPDATE', tenant_id: '1004', tenant_name: 'DigiConnect SA', actor: 'david.okonkwo', message: 'Suspended tenant', status: 'SUCCESS', created_at: '2026-03-05T09:00:00Z' },
  { id: 4, type: 'DID_ASSIGN', tenant_id: '1009', tenant_name: 'Infinity BPO', actor: 'james.naidoo', message: 'Assigned DID +27115550010', status: 'SUCCESS', created_at: '2025-10-01T10:00:00Z' },
  { id: 5, type: 'LICENSE_UPDATE', tenant_id: '1003', tenant_name: 'CloudPeak Solutions', actor: 'sarah.mitchell', message: 'Updated license allocation to 80', status: 'SUCCESS', created_at: '2026-01-15T11:00:00Z' },
  { id: 6, type: 'METADATA_UPDATE', tenant_id: '1008', tenant_name: 'HostVoice Kenya', actor: 'sarah.mitchell', message: 'Decommissioned tenant', status: 'SUCCESS', created_at: '2025-12-15T10:00:00Z' },
];

// ============================================================
// Portal Users
// ============================================================
export const portalUsers: PortalUser[] = [
  { username: 'sarah.mitchell', fullName: 'Sarah Mitchell', email: 'sarah@company.com', role: 'SUPER_ADMIN', is_active: true },
  { username: 'james.naidoo', fullName: 'James Naidoo', email: 'james@company.com', role: 'PROVISIONING_ADMIN', is_active: true },
  { username: 'david.okonkwo', fullName: 'David Okonkwo', email: 'david@company.com', role: 'SUPPORT_ADMIN', is_active: true },
];

// ============================================================
// Dashboard Summary
// ============================================================
export const dashboardSummary: DashboardSummary = {
  total_tenants: tenants.length,
  active_tenants: tenants.filter(t => t.status === 'ACTIVE').length,
  licenses_allocated: tenants.reduce((sum, t) => sum + (t.summary?.licenses_allocated || 0), 0),
  active_users: tenants.reduce((sum, t) => sum + (t.summary?.active_users || 0), 0),
  total_dids: dids.length,
  unassigned_dids: dids.filter(d => d.status === 'UNASSIGNED').length,
  campaigns_total: tenants.reduce((sum, t) => sum + (t.summary?.campaigns_total || 0), 0),
  tenants_near_license_cap: tenants.filter(t => {
    const s = t.summary;
    return s && s.licenses_allocated > 0 && s.licenses_in_use >= s.licenses_allocated * 0.9;
  }).length,
  last_sync: '2026-03-10T08:00:00Z',
};
