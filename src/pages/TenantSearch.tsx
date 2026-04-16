import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  X,
  Building2,
} from 'lucide-react';
import { StatusBadge, LoadingState, EmptyState, formatDate } from '../components/UI';
import * as api from '../services/api';
import type { TenantMetadata, TenantStatus } from '../types';

export function TenantSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenants, setTenants] = useState<TenantMetadata[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | ''>(searchParams.get('status') as TenantStatus | '' || '');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>('tenant_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 10;

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getTenants({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      setTenants(result.results);
      setTotalCount(result.count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTenants();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const statusCounts: Record<string, number> = {
    ALL: totalCount,
    ACTIVE: tenants.filter(t => t.status === 'ACTIVE').length,
    SUSPENDED: tenants.filter(t => t.status === 'SUSPENDED').length,
    TEST: tenants.filter(t => t.status === 'TEST').length,
    DECOMMISSIONED: tenants.filter(t => t.status === 'DECOMMISSIONED').length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Search</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount} tenant(s) found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tenant ID, name, customer code, DID…"
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
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                !statusFilter
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({statusCounts.ALL})
            </button>
            <button
              onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Active ({statusCounts.ACTIVE})
            </button>
            <button
              onClick={() => { setStatusFilter('SUSPENDED'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === 'SUSPENDED'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Suspended ({statusCounts.SUSPENDED})
            </button>
            <button
              onClick={() => { setStatusFilter('TEST'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === 'TEST'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Test ({statusCounts.TEST})
            </button>
            <button
              onClick={() => { setStatusFilter('DECOMMISSIONED'); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === 'DECOMMISSIONED'
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Decommissioned ({statusCounts.DECOMMISSIONED})
            </button>
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {(searchQuery || statusFilter) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Search: {searchQuery}
              <button onClick={() => { setSearchQuery(''); setPage(1); }} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-50 text-slate-700 rounded-full border border-slate-200">
              Status: {statusFilter}
              <button onClick={() => { setStatusFilter(''); setPage(1); }} className="hover:text-slate-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <LoadingState text="Loading tenants..." />
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={<Building2 className="w-8 h-8" />}
            title="No tenants found"
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
                  {[
                    { key: 'tenant_id', label: 'Tenant ID' },
                    { key: 'tenant_name', label: 'Tenant Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'licenses', label: 'Licenses' },
                    { key: 'users', label: 'Users' },
                    { key: 'dids', label: 'DIDs' },
                    { key: 'campaigns', label: 'Campaigns' },
                    { key: 'last_activity', label: 'Last Activity' },
                    { key: 'actions', label: 'Actions' },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => {
                        if (!['actions'].includes(col.key)) handleSort(col.key);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {['actions'].includes(col.key) ? null : sortField === col.key ? (
                          <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map(tenant => (
                  <tr
                    key={tenant.tenant_id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tenants/${tenant.tenant_id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {tenant.tenant_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{tenant.tenant_name}</p>
                        {tenant.customer_code && (
                          <p className="text-xs text-slate-400">{tenant.customer_code}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tenant.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-semibold text-slate-900">{tenant.summary?.licenses_allocated || 0}</span>
                        {tenant.summary && (
                          <div className="w-full mt-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((tenant.summary.licenses_in_use / (tenant.summary.licenses_allocated || 1)) * 100))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-slate-900">{tenant.summary?.active_users || 0}</span>
                        <span className="text-slate-400 text-xs"> / {tenant.summary?.total_users || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tenant.summary?.dids_allocated || 0}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-slate-900">{tenant.summary?.campaigns_total || 0}</span>
                        {tenant.summary && tenant.summary.campaigns_active > 0 && (
                          <span className="text-xs text-emerald-600 ml-1">
                            ({tenant.summary.campaigns_active} active)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(tenant.summary?.last_activity_at || null)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/tenants/${tenant.tenant_id}`);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
