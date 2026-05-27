import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/contexts/AuthContext";
import { assignDid, getPortalMeta, getTenantCampaigns, getTenantDids, releaseDid } from "@/services/api";

export function TenantDidsPage() {
  const { id = "" } = useParams();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const metaQuery = useQuery({ queryKey: ["portal-meta"], queryFn: getPortalMeta });
  const didsQuery = useQuery({ queryKey: ["tenant-dids", id], queryFn: () => getTenantDids(id) });
  const campaignsQuery = useQuery({ queryKey: ["tenant-campaigns", id], queryFn: () => getTenantCampaigns(id) });
  const isReadOnlyLiveData = metaQuery.data?.isReadOnlyLiveData ?? false;

  const releaseMutation = useMutation({
    mutationFn: releaseDid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-dids", id] });
      queryClient.invalidateQueries({ queryKey: ["dids"] });
      showToast("DID released");
    },
  });

  return (
    <DataTable
      columns={[
        { key: "number", header: "Number", render: (did) => did.number },
        { key: "provider", header: "Provider", render: (did) => did.provider ?? "Unmapped" },
        { key: "status", header: "Status", render: (did) => <StatusBadge value={did.status} /> },
        { key: "assigned", header: "Assigned To", render: (did) => did.campaignName ?? "unassigned" },
        {
          key: "actions",
          header: "Actions",
          render: (did) => (
            <div className="flex items-center gap-2">
              <select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs">
                <option value="">Assign to campaign</option>
                {campaignsQuery.data?.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </select>
              <button onClick={() => assignDid({ didIds: [did.id], tenantId: id, campaignId: selectedCampaignId || undefined }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["tenant-dids", id] });
                queryClient.invalidateQueries({ queryKey: ["dids"] });
                showToast("DID reassigned");
              })} disabled={!isAdmin || isReadOnlyLiveData} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
                Assign
              </button>
              <button onClick={() => releaseMutation.mutate(did.id)} disabled={!isAdmin || isReadOnlyLiveData} className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                Unassign
              </button>
            </div>
          ),
        },
      ]}
      rows={didsQuery.data ?? []}
    />
  );
}
