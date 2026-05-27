import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Gauge, PhoneCall, PhoneOff, SearchCheck, UserCheck, Users2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { KPICard } from "@/components/shared/KPICard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { getDashboardMetrics, getRecentChanges } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const metricsQuery = useQuery({ queryKey: ["dashboard-metrics"], queryFn: getDashboardMetrics });
  const changesQuery = useQuery({ queryKey: ["recent-changes"], queryFn: () => getRecentChanges(10) });

  const cards = useMemo(() => {
    if (!metricsQuery.data) return [];
    return [
      { title: "Total Tenants", value: metricsQuery.data.totalTenants, subtitle: "Across all customer accounts", icon: <Building2 className="h-5 w-5" /> },
      { title: "Active Tenants", value: metricsQuery.data.activeTenants, subtitle: "Live and provisioned", icon: <SearchCheck className="h-5 w-5" /> },
      { title: "Allocated Licenses", value: metricsQuery.data.totalAllocatedLicenses, subtitle: "All seat assignments", icon: <Users2 className="h-5 w-5" /> },
      { title: "Active Users", value: metricsQuery.data.totalActiveUsers, subtitle: "Logged in today", icon: <UserCheck className="h-5 w-5" /> },
      { title: "Allocated DIDs", value: metricsQuery.data.totalAllocatedDids, subtitle: "Numbers tied to tenants", icon: <PhoneCall className="h-5 w-5" /> },
      { title: "Free DIDs", value: metricsQuery.data.unassignedDids, subtitle: "Ready to assign", icon: <PhoneOff className="h-5 w-5" /> },
      { title: "Total Campaigns", value: metricsQuery.data.totalCampaigns, subtitle: "Across inbound and outbound", icon: <Gauge className="h-5 w-5" /> },
    ];
  }, [metricsQuery.data]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Global Control"
        title="Portal dashboard"
        description="Search across tenants, track platform capacity, and jump straight into the operational work queue."
        actions={
          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <>
                <button onClick={() => navigate("/tenants/new")} className="rounded-2xl bg-[var(--portal-primary)] px-4 py-2.5 text-sm font-medium text-white">
                  Create Tenant
                </button>
                <button onClick={() => navigate("/dids")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                  Assign DID
                </button>
              </>
            ) : null}
          </div>
        }
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Search tenant ID, company, domain, DID, campaign, admin username" />
      {metricsQuery.data ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            metricsQuery.data.source === "backend" || metricsQuery.data.source === "db-bridge"
              ? "bg-sky-50 text-sky-700"
              : metricsQuery.data.source === "yaxxa-api"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {metricsQuery.data.source === "backend"
            ? "Production backend mode is active. Live tenant data is flowing through the portal API service."
            : metricsQuery.data.source === "db-bridge"
              ? "Live MariaDB replica data is active in read-only bridge mode."
            : metricsQuery.data.source === "yaxxa-api"
              ? "Live Yaxxa API data is active for dashboard metrics."
              : "Dashboard is using mock fallback data. Add VITE_YAXXA_API_TOKEN to enable the documented Yaxxa Admin API endpoints."}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate(`/tenants?q=${encodeURIComponent(query)}`)} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          Search directory
        </button>
        <button onClick={() => navigate("/tenants?status=all&licenseMin=0&licenseMax=0")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Unlicensed tenants
        </button>
        <button onClick={() => navigate("/tenants?status=suspended")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
          Inactive tenants
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {metricsQuery.isLoading
          ? Array.from({ length: 7 }).map((_, index) => <LoadingSkeleton key={index} className="h-36" />)
          : cards.map((card) => <KPICard key={card.title} {...card} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <DataTable
          columns={[
            {
              key: "tenant",
              header: "Recent Changes",
              render: (row) => (
                <div>
                  <p className="font-semibold text-slate-900">{row.tenantName ?? "Global system"}</p>
                  <p className="mt-1 text-sm text-slate-500">{row.details}</p>
                </div>
              ),
            },
            {
              key: "action",
              header: "Action",
              render: (row) => <StatusBadge value={row.action.split(".")[1] ?? row.action} />,
            },
            {
              key: "actor",
              header: "Actor",
              render: (row) => row.actor,
            },
            {
              key: "timestamp",
              header: "Timestamp",
              render: (row) => formatDateTime(row.createdAt),
            },
          ]}
          rows={changesQuery.data ?? []}
        />

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
          {isAdmin ? (
            <>
              <button onClick={() => navigate("/tenants/new")} className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-medium text-white">
                Create tenant
                <span>+</span>
              </button>
              <button onClick={() => navigate("/dids")} className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700">
                Assign DID
                <span>→</span>
              </button>
              <button onClick={() => navigate("/admin")} className="flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700">
                Ops alerts
                <span>→</span>
              </button>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Viewer mode is read-only. Contact an admin for changes.</div>
          )}
          <div className="rounded-2xl bg-[var(--portal-primary-soft)] p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Search tip</p>
            <p className="mt-1">Use the same query for tenant ID, DID number, campaign name, domain, or admin username.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
