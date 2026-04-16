import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Phone,
  PhoneOff,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Search,
  ShieldCheck,
  Activity,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { KPICard, StatusBadge, formatDateTime, LoadingState } from '../components/UI';
import * as api from '../services/api';
import type { DashboardSummary, RecentActivity } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, activityData] = await Promise.all([
          api.getDashboardSummary(),
          api.getRecentActivity(),
        ]);
        setSummary(summaryData);
        setActivities(activityData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return <LoadingState text="Failed to load dashboard" />;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Last data sync: <span className="font-medium text-slate-700">{formatDateTime(summary.last_sync)}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Tenants"
          value={summary.total_tenants}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
          trend={{ value: 8, direction: 'up' }}
        />
        <KPICard
          label="Active Tenants"
          value={summary.active_tenants}
          icon={<ShieldCheck className="w-5 h-5" />}
          color="emerald"
        />
        <KPICard
          label="Allocated Licenses"
          value={summary.licenses_allocated.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          label="Active Users"
          value={summary.active_users.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <KPICard
          label="Total DIDs"
          value={summary.total_dids}
          icon={<Phone className="w-5 h-5" />}
          color="slate"
        />
        <KPICard
          label="Unassigned DIDs"
          value={summary.unassigned_dids}
          icon={<PhoneOff className="w-5 h-5" />}
          color="amber"
        />
        <KPICard
          label="Total Campaigns"
          value={summary.campaigns_total}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <KPICard
          label="Near License Cap"
          value={summary.tenants_near_license_cap}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Recent Changes</h2>
            <button
              onClick={() => navigate('/audit')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {activities.map(activity => (
              <div key={activity.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={activity.status} variant="small" />
                      <Link
                        to={`/tenants/${activity.tenant_id}`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate"
                      >
                        {activity.tenant_name}
                      </Link>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{activity.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{activity.actor}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/tenants/create')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <PlusCircle className="w-5 h-5" /> Create Tenant
              </button>
              <button
                onClick={() => navigate('/dids')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                <Search className="w-5 h-5" /> Search DIDs
              </button>
              <button
                onClick={() => navigate('/tenants?status=ACTIVE')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                <ShieldCheck className="w-5 h-5" /> View Active Tenants
              </button>
              <button
                onClick={() => navigate('/tenants?status=SUSPENDED')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                <AlertTriangle className="w-5 h-5" /> View Inactive Tenants
              </button>
            </div>
          </div>

          {/* Near capacity alert */}
          {summary.tenants_near_license_cap > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-800">License Capacity Alerts</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    {summary.tenants_near_license_cap} tenant(s) are near their license allocation cap (≥90% utilization).
                  </p>
                  <button
                    onClick={() => navigate('/tenants')}
                    className="mt-2 text-xs font-medium text-amber-800 underline hover:text-amber-900"
                  >
                    Review tenants →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
