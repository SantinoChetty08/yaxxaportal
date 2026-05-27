import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/shared/Card";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getAdminDashboard } from "@/services/api";

export function AdminDashboardPage() {
  const adminQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard });
  const data = adminQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support View" title="Ops and admin dashboard" description="Monitor capacity, stale campaigns, integration failures, and tenant accounts that need intervention." />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Overall system health</p>
            <div className="mt-2">
              <StatusBadge value={data?.overallHealth ?? "warning"} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <DataTable
          columns={[
            { key: "tenant", header: "Tenants near license cap", render: (row) => row.tenantName },
            { key: "allocated", header: "Allocated", render: (row) => row.allocated },
            { key: "inUse", header: "In Use", render: (row) => row.inUse },
            { key: "util", header: "%", render: (row) => `${row.utilization}%` },
          ]}
          rows={data?.nearCapTenants ?? []}
        />
        <DataTable
          columns={[
            { key: "number", header: "Unmapped DIDs", render: (row) => row.number },
            { key: "provider", header: "Provider", render: (row) => row.provider ?? "Missing" },
            { key: "trunk", header: "Trunk", render: (row) => row.trunk ?? "Missing" },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
          ]}
          rows={data?.unmappedDids ?? []}
        />
        <DataTable
          columns={[
            { key: "campaign", header: "Inactive campaigns", render: (row) => row.name },
            { key: "tenant", header: "Tenant", render: (row) => row.tenantId },
            { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
            { key: "agents", header: "Agents", render: (row) => row.agentsAssigned },
          ]}
          rows={data?.inactiveCampaigns ?? []}
        />
        <DataTable
          columns={[
            { key: "tenant", header: "Zero active admins", render: (row) => row.name },
            { key: "manager", header: "Account Manager", render: (row) => row.accountManager },
            { key: "licenses", header: "Licenses", render: (row) => `${row.licenseInUse}/${row.licenseSeats}` },
          ]}
          rows={data?.tenantsWithZeroActiveAdmins ?? []}
        />
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-slate-950">API failure log</h2>
          </div>
          <div className="space-y-3">
            {data?.apiFailures.map((failure) => (
              <div key={failure.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{failure.tenantName ?? "Platform"}</p>
                    <p className="text-sm text-slate-500">{failure.details}</p>
                  </div>
                  <StatusBadge value="error" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
