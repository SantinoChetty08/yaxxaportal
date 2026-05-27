import { useOutletContext, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/shared/Card";
import { getTenantCampaigns, getTenantUsers } from "@/services/api";
import type { Tenant } from "@/types";

export function TenantOverviewPage() {
  const { tenant } = useOutletContext<{ tenant: Tenant }>();
  const { id = "" } = useParams();
  const usersQuery = useQuery({ queryKey: ["tenant-users", id], queryFn: () => getTenantUsers(id) });
  const campaignsQuery = useQuery({ queryKey: ["tenant-campaigns", id], queryFn: () => getTenantCampaigns(id) });

  const chartData = [
    { label: "Active Users", value: tenant.activeUsers },
    { label: "DIDs", value: tenant.didsAllocated },
    { label: "Campaigns", value: tenant.campaignsActive },
    { label: "Queues", value: tenant.queueCount },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">Tenant health snapshot</h2>
        <p className="mt-2 text-sm text-slate-500">{tenant.notes}</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Health status</h3>
          <p className="mt-4 text-5xl font-semibold text-slate-950">{tenant.healthScore}</p>
          <p className="mt-2 text-sm text-slate-500">Composite score based on license utilization, sync health, and admin coverage.</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Integration flags</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {Object.entries(tenant.integrationFlags).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={value ? "text-emerald-600" : "text-slate-400"}>{value ? "Enabled" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Quick stats</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">Users: {usersQuery.data?.length ?? 0}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Campaigns: {campaignsQuery.data?.length ?? 0}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Channels: {Object.values(tenant.channels).filter(Boolean).length}</div>
            <div className="rounded-2xl bg-slate-50 p-4">API: {tenant.apiStatus}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
