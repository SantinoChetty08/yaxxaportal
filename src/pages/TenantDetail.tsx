import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Phone,
  FileText,
  CreditCard,
  Plug,
  ClipboardList,
  Edit3,
  PhoneForwarded,
  Hash,
  Clock,
  Plus,
} from 'lucide-react';
import { StatusBadge, LoadingState, ErrorState, formatDate, formatDateTime } from '../components/UI';
import * as api from '../services/api';
import type { TenantDetail, TenantUser, TenantCampaign } from '../types';

type TabId = 'overview' | 'users' | 'campaigns' | 'dids' | 'licensing' | 'integrations' | 'audit';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { id: 'campaigns', label: 'Campaigns', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'dids', label: 'DIDs / CLIs', icon: <Phone className="w-4 h-4" /> },
  { id: 'licensing', label: 'Licensing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug className="w-4 h-4" /> },
  { id: 'audit', label: 'Audit Log', icon: <Hash className="w-4 h-4" /> },
];

export function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [campaigns, setCampaigns] = useState<TenantCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      setLoading(true);
      try {
        const [tenantData, usersData, campaignsData] = await Promise.all([
          api.getTenantDetail(tenantId),
          api.getTenantUsers(tenantId),
          api.getTenantCampaigns(tenantId),
        ]);
        setTenant(tenantData);
        setUsers(usersData);
        setCampaigns(campaignsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);

  const handleAddNote = async () => {
    if (!tenantId || !noteText.trim()) return;
    try {
      const newNote = await api.createTenantNote(tenantId, noteText.trim());
      if (tenant) {
        setTenant({ ...tenant, tenant_notes: [newNote, ...tenant.tenant_notes] });
      }
      setNoteText('');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingState text="Loading tenant details..." />;
  if (!tenant) return <ErrorState message="Tenant not found" onRetry={() => window.location.reload()} />;

  const summary = tenant.summary;
  const licensePct = summary && summary.licenses_allocated > 0
    ? Math.round((summary.licenses_in_use / summary.licenses_allocated) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{tenant.tenant_name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              ID: {tenant.tenant_id}
            </span>
            <StatusBadge status={tenant.status} />
            {tenant.customer_code && (
              <span className="text-xs text-slate-400">Code: {tenant.customer_code}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <PhoneForwarded className="w-4 h-4" /> Assign DID
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Licenses', value: `${summary.licenses_allocated}`, sub: `${summary.licenses_in_use} in use`, color: 'text-blue-700' },
            { label: 'Active Users', value: `${summary.active_users}`, sub: `of ${summary.total_users}`, color: 'text-emerald-700' },
            { label: 'DIDs', value: `${summary.dids_allocated}`, sub: 'allocated', color: 'text-purple-700' },
            { label: 'Campaigns', value: `${summary.campaigns_total}`, sub: `${summary.campaigns_active} active`, color: 'text-amber-700' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
          {/* License utilization */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center col-span-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">License Utilization</p>
            <p className={`text-2xl font-bold mt-1 ${licensePct >= 90 ? 'text-red-600' : licensePct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {licensePct}%
            </p>
            <div className="w-full mt-2 bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${licensePct >= 90 ? 'bg-red-500' : licensePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, licensePct)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center col-span-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Meta</p>
            <div className="mt-1 space-y-0.5 text-left">
              <p className="text-xs text-slate-500">
                <Clock className="w-3 h-3 inline mr-1" /> Created: {formatDate(tenant.created_at)}
              </p>
              <p className="text-xs text-slate-500">
                Last activity: {formatDateTime(summary.last_activity_at)}
              </p>
              {tenant.internal_owner && (
                <p className="text-xs text-slate-500">Owner: <span className="text-slate-700">{tenant.internal_owner}</span></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Tenant Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Tenant ID', value: tenant.tenant_id },
                    { label: 'Display Name', value: tenant.tenant_name },
                    { label: 'Customer Code', value: tenant.customer_code || '—' },
                    { label: 'Status', value: tenant.status },
                    { label: 'Environment', value: tenant.environment || '—' },
                    { label: 'Timezone', value: tenant.timezone },
                    { label: 'Internal Owner', value: tenant.internal_owner || '—' },
                    { label: 'Created', value: formatDateTime(tenant.created_at) },
                    { label: 'Last Updated', value: formatDateTime(tenant.updated_at) },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-slate-900 mt-1">
                        {item.label === 'Status' ? <StatusBadge status={item.value} variant="small" /> : item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Notes</h3>
                {tenant.notes && (
                  <div className="mb-3 bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                    {tenant.notes}
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add an internal note…"
                    rows={2}
                    className="flex-1 text-sm bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="self-end px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {tenant.tenant_notes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {tenant.tenant_notes.map(note => (
                      <div key={note.id} className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-sm text-slate-700">{note.note_text}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {note.created_by_username} · {formatDateTime(note.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Users ({users.length})
                </h3>
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500">Active: {users.filter(u => u.status === 'ACTIVE').length}</span>
                  <span className="text-xs text-slate-500">Disabled: {users.filter(u => u.status === 'DISABLED').length}</span>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Role</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Last Login</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">License</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(user => (
                    <tr key={user.user_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div>
                          <p className="font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-xs text-slate-400">@{user.username}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{user.role}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={user.status} variant="small" /></td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">{formatDateTime(user.last_login)}</td>
                      <td className="py-2.5 px-3">
                        {user.consumes_license
                          ? <span className="text-xs text-emerald-600 font-medium">Yes</span>
                          : <span className="text-xs text-slate-400">No</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Campaigns tab */}
          {activeTab === 'campaigns' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Campaigns ({campaigns.length})
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Campaign</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Agents</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">DIDs</th>
                    <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map(c => (
                    <tr key={c.campaign_id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <div>
                          <p className="font-medium text-slate-900">{c.campaign_name}</p>
                          <p className="text-xs text-slate-400">ID: {c.campaign_id}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{c.campaign_type}</span>
                      </td>
                      <td className="py-2.5 px-3"><StatusBadge status={c.campaign_status} variant="small" /></td>
                      <td className="py-2.5 px-3 text-slate-700">{c.active_agents}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.linked_dids}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">{formatDateTime(c.last_activity_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DIDs tab */}
          {activeTab === 'dids' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                DIDs / CLIs ({tenant.dids.length})
              </h3>
              {tenant.dids.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No DIDs assigned to this tenant.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">DID Number</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">CLI</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Provider</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Trunk</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-2 px-3 uppercase">Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tenant.dids.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-sm font-medium text-slate-900">{d.did_number}</td>
                        <td className="py-2.5 px-3 font-mono text-sm text-slate-600">{d.cli_number || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.provider_name || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{d.trunk_name || '—'}</td>
                        <td className="py-2.5 px-3"><StatusBadge status={d.status} variant="small" /></td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">{formatDate(d.assigned_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Licensing tab */}
          {activeTab === 'licensing' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">License Allocations</h3>
              {tenant.license_allocations.map(alloc => (
                <div key={alloc.id} className="bg-slate-50 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{alloc.license_type} Licenses</h4>
                      {alloc.notes && <p className="text-xs text-slate-500 mt-0.5">{alloc.notes}</p>}
                    </div>
                    <StatusBadge status={tenant.status} variant="small" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Allocated</p>
                      <p className="text-xl font-bold text-slate-900">{alloc.allocated_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">In Use</p>
                      <p className="text-xl font-bold text-blue-600">{summary?.licenses_in_use || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Available</p>
                      <p className="text-xl font-bold text-emerald-600">{(alloc.allocated_count - (summary?.licenses_in_use || 0))}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Utilization</span>
                      <span>{licensePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          licensePct >= 90 ? 'bg-red-500' : licensePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, licensePct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Integrations tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Integration Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'HoduCC API', status: 'Connected', detail: 'Last sync: ' + formatDateTime(summary?.last_synced_at ?? null) },
                  { name: 'Webhook Endpoint', status: tenant.environment === 'production' ? 'Active' : 'Inactive', detail: tenant.environment === 'production' ? 'Configured and active' : 'Not configured for non-production' },
                  { name: 'Data Sync', status: summary?.sync_status === 'OK' ? 'Healthy' : 'Check', detail: 'Full sync every 15 min' },
                  { name: 'External Routing', status: tenant.environment === 'production' ? 'Active' : 'Disabled', detail: 'SIP trunk routing' },
                ].map(int => (
                  <div key={int.name} className="bg-slate-50 rounded-lg p-4 flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{int.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{int.detail}</p>
                    </div>
                    <StatusBadge status={int.status} variant="small" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit tab */}
          {activeTab === 'audit' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {tenant.tenant_notes.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">No audit entries for this tenant.</p>
                ) : (
                  <div className="space-y-3">
                    {tenant.tenant_notes.map(note => (
                      <div key={note.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-700">{note.note_text}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {note.created_by_username} · {formatDateTime(note.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
