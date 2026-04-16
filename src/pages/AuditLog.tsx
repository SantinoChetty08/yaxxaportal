import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { StatusBadge, LoadingState, EmptyState, formatDateTime } from '../components/UI';
import * as api from '../services/api';
import type { AuditLogEntry } from '../types';

export function AuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAuditLogs({
        action_type: actionTypeFilter || undefined,
        status: statusFilter || undefined,
      });
      setLogs(result.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actionTypeFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const actionTypes = [...new Set(logs.map(l => l.action_type))];
  const filteredLogs = logs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.tenant_name?.toLowerCase().includes(q) ||
        l.actor_username?.toLowerCase().includes(q) ||
        l.message?.toLowerCase().includes(q) ||
        l.entity_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete audit trail of all portal actions
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant, user, message…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Filter className="w-4 h-4" /> Filters
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">Filters</h3>
            <button
              onClick={() => { setActionTypeFilter(''); setStatusFilter(''); }}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActionTypeFilter('')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                !actionTypeFilter
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Actions
            </button>
            {actionTypes.map(at => (
              <button
                key={at}
                onClick={() => setActionTypeFilter(actionTypeFilter === at ? '' : at)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  actionTypeFilter === at
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {at}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['SUCCESS', 'FAILED', 'PENDING'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <LoadingState text="Loading audit logs..." />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No audit entries found"
            description="Try adjusting your search terms or filters."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Tenant</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-2">User</div>
            <div className="col-span-1">Message</div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="px-5 py-4 hover:bg-slate-50/80 transition-colors md:grid md:grid-cols-12 md:gap-4 md:items-center"
              >
                {/* Timestamp */}
                <div className="col-span-2 mb-2 md:mb-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(log.created_at)}
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 mb-2 md:mb-0">
                  <StatusBadge status={log.status} variant="small" />
                </div>

                {/* Tenant */}
                <div className="col-span-2 mb-2 md:mb-0">
                  {log.tenant ? (
                    <button
                      onClick={() => navigate(`/tenants/${log.tenant}`)}
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Building2 className="w-3 h-3" />
                      {log.tenant_name || log.tenant}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>

                {/* Action */}
                <div className="col-span-2 mb-2 md:mb-0">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {log.action_type}
                  </span>
                </div>

                {/* Entity */}
                <div className="col-span-2 mb-2 md:mb-0">
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">{log.entity_type}</span>
                    {log.entity_id && <span className="text-slate-400 ml-1">{log.entity_id}</span>}
                  </p>
                </div>

                {/* User */}
                <div className="col-span-2 mb-2 md:mb-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3 h-3" />
                    {log.actor_username || '—'}
                  </div>
                </div>

                {/* Message */}
                <div className="col-span-1">
                  <p className="text-xs text-slate-500 truncate">{log.message || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
