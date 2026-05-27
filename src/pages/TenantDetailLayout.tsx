import { Activity, PlugZap, RadioTower, ShieldCheck, Users } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/shared/Card";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TabNav } from "@/components/shared/TabNav";
import { formatDate, formatDateTime, percent } from "@/lib/format";
import { getTenantById } from "@/services/api";

export function TenantDetailLayout() {
  const { id = "" } = useParams();
  const tenantQuery = useQuery({ queryKey: ["tenant", id], queryFn: () => getTenantById(id) });

  if (tenantQuery.isLoading || !tenantQuery.data) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-28" />
        <LoadingSkeleton className="h-24" />
        <LoadingSkeleton className="h-80" />
      </div>
    );
  }

  const tenant = tenantQuery.data;
  const sparkline = tenant.peakConcurrentAgents.map((value, index) => ({ name: index, value }));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-950">{tenant.name}</h1>
              <StatusBadge value={tenant.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="font-mono text-slate-700">{tenant.id}</span>
              <span>Created {formatDate(tenant.createdAt)}</span>
              <span>Account manager: {tenant.accountManager}</span>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">API Sync</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{formatDateTime(tenant.lastSyncAt)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--portal-primary)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Licenses</p>
              <p className="text-xs text-slate-500">{tenant.licenseInUse} in use of {tenant.licenseSeats}</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-[var(--portal-primary)]" style={{ width: `${percent(tenant.licenseInUse, tenant.licenseSeats)}%` }} />
          </div>
        </Card>
        <Card className="p-5"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-emerald-600" /><div><p className="text-sm font-semibold text-slate-900">Active users</p><p className="text-xs text-slate-500">{tenant.activeUsers} logged in today</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><RadioTower className="h-5 w-5 text-indigo-600" /><div><p className="text-sm font-semibold text-slate-900">DIDs allocated</p><p className="text-xs text-slate-500">{tenant.didsAllocated} active numbers</p></div></div></Card>
        <Card className="p-5"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-amber-600" /><div><p className="text-sm font-semibold text-slate-900">Campaigns</p><p className="text-xs text-slate-500">{tenant.campaignsActive} active of {tenant.campaignsTotal}</p></div></div></Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <PlugZap className="h-5 w-5 text-slate-700" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Peak concurrent</p>
              <p className="text-xs text-slate-500">Weekly sparkline</p>
            </div>
          </div>
          <div className="mt-4 h-14">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <Area dataKey="value" stroke="#2563eb" fill="#bfdbfe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <TabNav
        items={[
          { label: "Overview", to: `/tenants/${tenant.id}`, end: true },
          { label: "Users", to: `/tenants/${tenant.id}/users` },
          { label: "Campaigns", to: `/tenants/${tenant.id}/campaigns` },
          { label: "DIDs / CLIs", to: `/tenants/${tenant.id}/dids` },
          { label: "Licensing", to: `/tenants/${tenant.id}/licensing` },
          { label: "Integrations", to: `/tenants/${tenant.id}/integrations` },
          { label: "Audit Log", to: `/tenants/${tenant.id}/audit` },
        ]}
      />

      <Outlet context={{ tenant }} />
    </div>
  );
}
