import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { getTenantAudit } from "@/services/api";
import { formatDateTime } from "@/lib/format";

export function TenantAuditPage() {
  const { id = "" } = useParams();
  const [filter, setFilter] = useState("");
  const auditQuery = useQuery({ queryKey: ["tenant-audit", id], queryFn: () => getTenantAudit(id) });
  const rows = (auditQuery.data ?? []).filter((event) => !filter || event.action.includes(filter));

  return (
    <div className="space-y-4">
      <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter by action type" className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" />
      <DataTable
        columns={[
          { key: "time", header: "Timestamp", render: (event) => formatDateTime(event.createdAt) },
          { key: "action", header: "Action", render: (event) => event.action },
          { key: "actor", header: "User", render: (event) => event.actor },
          { key: "details", header: "Details", render: (event) => event.details },
          { key: "change", header: "Previous → New", render: (event) => `${event.previousValue} → ${event.newValue}` },
        ]}
        rows={rows}
      />
    </div>
  );
}
