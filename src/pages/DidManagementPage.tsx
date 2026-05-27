import { useMemo, useState } from "react";
import { Plus, PhoneCall } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/components/shared/ToastProvider";
import { addDidRange, assignDid, getDids, getPortalMeta, quarantineDid, releaseDid } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export function DidManagementPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const metaQuery = useQuery({ queryKey: ["portal-meta"], queryFn: getPortalMeta });
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [assignment, setAssignment] = useState<"all" | "assigned" | "unassigned">("all");
  const [statusSelections, setStatusSelections] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddRange, setShowAddRange] = useState(false);
  const [confirmReleaseId, setConfirmReleaseId] = useState<string | null>(null);
  const [rangeForm, setRangeForm] = useState({ start: "27115551200", end: "27115551204", provider: "Telkom", country: "South Africa" });

  const didsQuery = useQuery({
    queryKey: ["dids", { search, provider, tenantId, assignment, statusSelections, country }],
    queryFn: () => getDids({ q: search, provider: provider || undefined, tenantId: tenantId || undefined, assignment, statuses: statusSelections as never[], country: country || undefined }),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: () => assignDid({ didIds: selectedIds, tenantId }),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["dids"] });
      showToast("DIDs assigned");
    },
  });

  const addRangeMutation = useMutation({
    mutationFn: () => addDidRange(rangeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dids"] });
      showToast("DID range added");
      setShowAddRange(false);
    },
  });

  const providerOptions = useMemo(() => Array.from(new Set((didsQuery.data ?? []).map((did) => did.provider).filter(Boolean))), [didsQuery.data]);
  const countries = useMemo(() => Array.from(new Set((didsQuery.data ?? []).map((did) => did.country))), [didsQuery.data]);
  const isReadOnlyLiveData = metaQuery.data?.isReadOnlyLiveData ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="DID management"
        description="Filter the global phone number pool, bulk assign inventory, and quarantine or release DIDs inline."
        actions={
          isAdmin ? (
            <button onClick={() => setShowAddRange(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--portal-primary)] px-4 py-2.5 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Add DID range
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search DID" className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
        <select value={provider} onChange={(event) => setProvider(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
          <option value="">All providers</option>
          {providerOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
          <option value="">All tenants</option>
          {metaQuery.data?.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
        </select>
        <select value={assignment} onChange={(event) => setAssignment(event.target.value as typeof assignment)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
          <option value="all">All assignments</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <select value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm">
          <option value="">All countries</option>
          {countries.map((item) => <option key={item}>{item}</option>)}
        </select>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Selected: {selectedIds.length}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["free", "reserved", "active", "quarantined"] as const).map((status) => (
          <button key={status} onClick={() => setStatusSelections((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status])} className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${statusSelections.includes(status) ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {status}
          </button>
        ))}
      </div>

      {isReadOnlyLiveData ? (
        <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
          DID inventory is running against the live MariaDB replica in read-only mode. Assign, release, quarantine, and range creation are disabled here.
        </div>
      ) : null}

      {didsQuery.data && didsQuery.data.length === 0 ? (
        <EmptyState icon={<PhoneCall className="h-8 w-8" />} title="No DIDs found" description="Adjust the provider, status, or tenant filters to bring more inventory into view." />
      ) : (
        <DataTable
          columns={[
            {
              key: "select",
              header: "",
              render: (did) => <input type="checkbox" checked={selectedIds.includes(did.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, did.id] : current.filter((item) => item !== did.id))} />,
            },
            { key: "number", header: "Number", render: (did) => did.number },
            { key: "provider", header: "Provider / Trunk", render: (did) => <div><p>{did.provider ?? "Unmapped"}</p><p className="text-xs text-slate-500">{did.trunk ?? "No trunk"}</p></div> },
            { key: "tenant", header: "Assigned Tenant", render: (did) => did.tenantName ?? "Unassigned" },
            { key: "status", header: "Status", render: (did) => <StatusBadge value={did.status} /> },
            { key: "country", header: "Country / Prefix", render: (did) => `${did.country} ${did.prefix}` },
            { key: "created", header: "Created Date", render: (did) => did.createdAt.slice(0, 10) },
            {
              key: "actions",
              header: "Inline Actions",
              render: (did) => (
                <div className="flex gap-2">
                  <button onClick={() => tenantId && assignDid({ didIds: [did.id], tenantId }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["dids"] });
                    showToast("DID assigned");
                  })} disabled={!isAdmin || isReadOnlyLiveData} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
                    Assign
                  </button>
                  <button onClick={() => setConfirmReleaseId(did.id)} disabled={!isAdmin || isReadOnlyLiveData} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
                    Release
                  </button>
                  <button onClick={() => quarantineDid(did.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: ["dids"] });
                    showToast("DID quarantined");
                  })} disabled={!isAdmin || isReadOnlyLiveData} className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                    Quarantine
                  </button>
                </div>
              ),
            },
          ]}
          rows={didsQuery.data ?? []}
          footer={
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Bulk actions apply to checked rows.</p>
              <div className="flex gap-2">
                <button disabled={!isAdmin || isReadOnlyLiveData || !tenantId || selectedIds.length === 0} onClick={() => bulkAssignMutation.mutate()} className="rounded-xl bg-[var(--portal-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
                  Bulk assign
                </button>
                <button disabled={!isAdmin || isReadOnlyLiveData || selectedIds.length === 0} onClick={() => Promise.all(selectedIds.map((id) => releaseDid(id))).then(() => {
                  setSelectedIds([]);
                  queryClient.invalidateQueries({ queryKey: ["dids"] });
                  showToast("DIDs released");
                })} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40">
                  Bulk release
                </button>
              </div>
            </div>
          }
        />
      )}

      {isAdmin && !isReadOnlyLiveData && showAddRange && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-950">Add DID range</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <input value={rangeForm.start} onChange={(event) => setRangeForm((current) => ({ ...current, start: event.target.value }))} className="field" placeholder="Start number" />
              <input value={rangeForm.end} onChange={(event) => setRangeForm((current) => ({ ...current, end: event.target.value }))} className="field" placeholder="End number" />
              <input value={rangeForm.provider} onChange={(event) => setRangeForm((current) => ({ ...current, provider: event.target.value }))} className="field" placeholder="Provider" />
              <input value={rangeForm.country} onChange={(event) => setRangeForm((current) => ({ ...current, country: event.target.value }))} className="field" placeholder="Country" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAddRange(false)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
              <button onClick={() => addRangeMutation.mutate()} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">Add range</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmReleaseId) && !isReadOnlyLiveData}
        title="Release DID?"
        description="This will return the selected DID to the free pool."
        confirmLabel="Release"
        onCancel={() => setConfirmReleaseId(null)}
        onConfirm={() => {
          if (!confirmReleaseId) return;
          releaseDid(confirmReleaseId).then(() => {
            queryClient.invalidateQueries({ queryKey: ["dids"] });
            showToast("DID released");
            setConfirmReleaseId(null);
          });
        }}
      />
    </div>
  );
}
