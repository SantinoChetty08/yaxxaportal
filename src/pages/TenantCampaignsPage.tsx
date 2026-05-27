import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRelative } from "@/lib/format";
import { getTenantCampaigns } from "@/services/api";

export function TenantCampaignsPage() {
  const { id = "" } = useParams();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "draft" | "archived">("all");
  const campaignsQuery = useQuery({ queryKey: ["tenant-campaigns", id], queryFn: () => getTenantCampaigns(id) });
  const campaigns = useMemo(() => {
    const data = campaignsQuery.data ?? [];
    return statusFilter === "all" ? data : data.filter((campaign) => campaign.status === statusFilter);
  }, [campaignsQuery.data, statusFilter]);

  return (
    <div className="space-y-4">
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
        <option value="all">All campaign statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
      <DataTable
        columns={[
          { key: "name", header: "Campaign Name", render: (campaign) => campaign.name },
          { key: "type", header: "Type", render: (campaign) => campaign.type },
          { key: "status", header: "Status", render: (campaign) => <StatusBadge value={campaign.status} /> },
          { key: "agents", header: "Agents Assigned", render: (campaign) => campaign.agentsAssigned },
          { key: "dialer", header: "Dialer Type", render: (campaign) => campaign.dialerType },
          { key: "activity", header: "Recent Activity", render: (campaign) => formatRelative(campaign.recentActivityAt) },
          { key: "dids", header: "DIDs Used", render: (campaign) => campaign.didIds.length },
        ]}
        rows={campaigns}
      />
    </div>
  );
}
