import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDate } from "@/lib/format";
import { getPortalMeta, getTenants, updateTenantStatus } from "@/services/api";
import { Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function TenantListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingToggle, setPendingToggle] = useState<{ id: string; nextStatus: "active" | "suspended" } | null>(null);
  const metaQuery = useQuery({ queryKey: ["portal-meta"], queryFn: getPortalMeta });

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      status: (searchParams.get("status") as "all" | "active" | "suspended" | "test" | "decommissioned" | null) ?? "all",
      licenseMin: Number(searchParams.get("licenseMin") ?? "") || undefined,
      licenseMax: Number(searchParams.get("licenseMax") ?? "") || undefined,
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: 8,
    }),
    [searchParams],
  );

  const tenantsQuery = useQuery({ queryKey: ["tenants", filters], queryFn: () => getTenants(filters) });
  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: "active" | "suspended" }) => updateTenantStatus(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      showToast("Tenant status updated");
      setPendingToggle(null);
    },
  });

  const totalPages = Math.ceil((tenantsQuery.data?.total ?? 0) / 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tenant Directory"
        title="Search and manage tenants"
        description="Filter by lifecycle state, capacity, and creation date, then jump into details or change tenant status."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_repeat(4,1fr)]">
        <SearchBar
          value={filters.q ?? ""}
          onChange={(value) => setSearchParams((current) => {
            current.set("q", value);
            current.set("page", "1");
            return current;
          })}
          placeholder="Search tenant ID, company name, domain, DID, campaign, admin"
        />
        <select value={filters.status} onChange={(event) => setSearchParams((current) => {
          current.set("status", event.target.value);
          current.set("page", "1");
          return current;
        })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="test">Test</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
        <input type="number" value={filters.licenseMin ?? ""} onChange={(event) => setSearchParams((current) => {
          if (event.target.value) current.set("licenseMin", event.target.value);
          else current.delete("licenseMin");
          current.set("page", "1");
          return current;
        })} placeholder="Min licenses" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
        <input type="date" value={filters.createdFrom ?? ""} onChange={(event) => setSearchParams((current) => {
          if (event.target.value) current.set("createdFrom", event.target.value);
          else current.delete("createdFrom");
          current.set("page", "1");
          return current;
        })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
        <input type="date" value={filters.createdTo ?? ""} onChange={(event) => setSearchParams((current) => {
          if (event.target.value) current.set("createdTo", event.target.value);
          else current.delete("createdTo");
          current.set("page", "1");
          return current;
        })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
      </div>

      <div className={`rounded-2xl px-4 py-3 text-sm ${metaQuery.data?.dataSource === "db-bridge" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
        {metaQuery.data?.dataSource === "db-bridge"
          ? "Tenant data is coming from the live MariaDB replica through the local bridge. Status changes are disabled because the replica is read-only."
          : "When VITE_YAXXA_API_TOKEN is configured, the tenant directory will pull live tenant and license data from the documented getLicenseSummary endpoint. Undocumented fields continue to use portal fallbacks."}
      </div>

      {tenantsQuery.data && tenantsQuery.data.items.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="No tenants match these filters" description="Try widening the status, date, or license filters to bring more accounts into view." />
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "Tenant ID", render: (tenant) => <span className="font-mono text-xs text-slate-600">{tenant.id}</span> },
            { key: "name", header: "Tenant Name", render: (tenant) => <div><p className="font-semibold text-slate-900">{tenant.name}</p><p className="text-xs text-slate-500">{tenant.domain}</p></div> },
            { key: "status", header: "Status", render: (tenant) => <StatusBadge value={tenant.status} /> },
            { key: "licenses", header: "Licenses Allocated", render: (tenant) => tenant.licenseSeats },
            { key: "users", header: "Active Users", render: (tenant) => `${tenant.activeUsers} / ${tenant.totalUsers}` },
            { key: "dids", header: "DIDs Allocated", render: (tenant) => tenant.didsAllocated },
            { key: "campaigns", header: "Campaigns", render: (tenant) => `${tenant.campaignsActive} / ${tenant.campaignsTotal}` },
            { key: "createdAt", header: "Created Date", render: (tenant) => formatDate(tenant.createdAt) },
            {
              key: "actions",
              header: "Actions",
              render: (tenant) => (
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/tenants/${tenant.id}`)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">View</button>
                  {isAdmin ? (
                    <>
                      <button onClick={() => navigate(`/tenants/${tenant.id}`)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">Edit</button>
                      <button
                        onClick={() => setPendingToggle({ id: tenant.id, nextStatus: tenant.status === "suspended" ? "active" : "suspended" })}
                        disabled={metaQuery.data?.isReadOnlyLiveData}
                        className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {tenant.status === "suspended" ? "Activate" : "Suspend"}
                      </button>
                    </>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">Read only</span>
                  )}
                </div>
              ),
            },
          ]}
          rows={tenantsQuery.data?.items ?? []}
          footer={
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Page {filters.page} of {totalPages || 1}</p>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setSearchParams((current) => {
                  current.set("page", String(Math.max((filters.page ?? 1) - 1, 1)));
                  return current;
                })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
                <button disabled={filters.page >= totalPages} onClick={() => setSearchParams((current) => {
                  current.set("page", String((filters.page ?? 1) + 1));
                  return current;
                })} className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title={pendingToggle?.nextStatus === "suspended" ? "Suspend tenant?" : "Activate tenant?"}
        description={metaQuery.data?.isReadOnlyLiveData ? "Live replica mode is read-only. Connect a writable backend to change tenant status." : "This updates tenant availability in the mock service layer and refreshes the dashboard metrics."}
        confirmLabel={pendingToggle?.nextStatus === "suspended" ? "Suspend" : "Activate"}
        onCancel={() => setPendingToggle(null)}
        onConfirm={() => pendingToggle && mutation.mutate(pendingToggle)}
      />
    </div>
  );
}
