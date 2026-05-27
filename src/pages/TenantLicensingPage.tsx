import { AlertTriangle } from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { useOutletContext } from "react-router-dom";
import { Card } from "@/components/shared/Card";
import type { Tenant } from "@/types";
import { percent } from "@/lib/format";

export function TenantLicensingPage() {
  const { tenant } = useOutletContext<{ tenant: Tenant }>();
  const utilization = percent(tenant.licenseInUse, tenant.licenseSeats);
  const data = [{ name: "Utilization", value: utilization, fill: utilization > 100 ? "#ef4444" : "#2563eb" }];

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">Allocated vs in-use seats</h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="65%" outerRadius="100%" data={data} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={14} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-4xl font-semibold text-slate-950">{utilization}%</p>
      </Card>

      <div className="space-y-6">
        {tenant.licenseInUse > tenant.licenseSeats && (
          <Card className="border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <div>
                <h3 className="text-lg font-semibold text-rose-900">Over-allocation warning</h3>
                <p className="mt-2 text-sm text-rose-700">In-use seats exceed the allocated count. Raise the tenant seat cap or disable users.</p>
              </div>
            </div>
          </Card>
        )}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Channel breakdown</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(tenant.channels).map(([channel, enabled]) => (
              <div key={channel} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="capitalize">{channel}</span>: <strong>{enabled ? "Enabled" : "Disabled"}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">Operational counters</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Campaigns: {tenant.campaignsTotal}</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Queues: {tenant.queueCount}</div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">Peak concurrent agents: {Math.max(...tenant.peakConcurrentAgents)}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
