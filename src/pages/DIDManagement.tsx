import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Eye,
} from 'lucide-react';
import { StatusBadge, LoadingState, EmptyState, formatDate } from '../components/UI';
import * as api from '../services/api';
import type { DIDInventory, DIDStatus } from '../types';

export function DIDManagementPage() {
  const navigate = useNavigate();
  const [dids, setDids] = useState<DIDInventory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DIDStatus | ''>('');
  const [providerFilter, setProviderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;

  const fetchDIDs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getDIDs({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        page,
        page_size: pageSize,
      });
      setDids(result.results);
      setTotalCount(result.count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, providerFilter, page]);

  useEffect(() => {
    fetchDIDs();
  }, [fetchDIDs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDIDs();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setProviderFilter('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const providers = [...new Set(dids.map(d => d.provider_name).filter(Boolean))] as string[];
  const statusCounts: Record<string, number> = {
    ALL: totalCount,
    UNASSIGNED: dids.filter(d => d.status === 'UNASSIGNED').length,
    ASSIGNED: dids.filter(d => d.status === 'ASSIGNED').length,
    RESERVED: dids.filter(d => d.status === 'RESERVED').length,
    QUARANTINED: dids.filter(d => d.status === 'QUARANTINED').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DID / CLI Management</h1>
          <p className="text-sm text-slate-500 mt-1">{totalCount} DID(s) in inventory</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total DIDs', value: statusCounts.ALL, color: 'text-slate-900' },
          { label: 'Assigned', value: statusCounts.ASSIGNED, color: 'text-emerald-700' },
          { label: 'Unassigned', value: statusCounts.UNASSIGNED, color: 'text-amber-700' },
          { label: 'Reserved', value: statusCounts.RESERVED, color: 'text-purple-700' },
          { label: 'Quarantined', value: statusCounts.QUARANTINED, color: 'text-orange-700' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by DID or CLI number…"
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

      {/* Filters drawer */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-900">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'UNASSIGNED', 'ASSIGNED', 'RESERVED', 'QUARANTINED'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === 'ALL' ? '' : s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  (s === 'ALL' && !statusFilter) || statusFilter === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s === 'ALL' ? `All (${statusCounts.ALL})` : `${s} (${statusCounts[s]})`}
              </button>
            ))}
          </div>
          {providers.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 font-medium">Provider</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  onClick={() => { setProviderFilter(''); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    !providerFilter
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {providers.map(p => (
                  <button
                    key={p}
                    onClick={() => { setProviderFilter(p); setPage(1); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      providerFilter === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filters */}
      {(searchQuery || statusFilter || providerFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Search: {searchQuery}
              <button onClick={() => { setSearchQuery(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-50 text-slate-700 rounded-full border border-slate-200">
              Status: {statusFilter}
              <button onClick={() => { setStatusFilter(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
          {providerFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-50 text-slate-700 rounded-full border border-slate-200">
              Provider: {providerFilter}
              <button onClick={() => { setProviderFilter(''); setPage(1); }}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Results table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <LoadingState text="Loading DIDs..." />
        </div>
      ) : dids.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={<Phone className="w-8 h-8" />}
            title="No DIDs found"
            description="Try adjusting your search terms or filters."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DID Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CLI</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trunk</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dids.map(did => (
                  <tr key={did.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-slate-900">{did.did_number}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">{did.cli_number || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{did.provider_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{did.trunk_name || '—'}</td>
                    <td className="px-4 py-3">
                      {did.tenant ? (
                        <button
                          onClick={() => navigate(`/tenants/${did.tenant}`)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {did.tenant_name}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={did.status} variant="small" /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(did.assigned_at)}</td>
                    <td className="px-4 py-3">
                      {did.tenant && (
                        <button
                          onClick={() => navigate(`/tenants/${did.tenant}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                      p === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
