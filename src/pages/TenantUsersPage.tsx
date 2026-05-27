import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { getTenantUsers } from "@/services/api";

export function TenantUsersPage() {
  const { id = "" } = useParams();
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");
  const usersQuery = useQuery({ queryKey: ["tenant-users", id], queryFn: () => getTenantUsers(id) });

  const users = useMemo(() => {
    const data = usersQuery.data ?? [];
    return filter === "all" ? data : data.filter((user) => user.status === filter);
  }, [filter, usersQuery.data]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {(["all", "active", "disabled"] as const).map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-2xl px-4 py-2 text-sm font-medium ${filter === value ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {value} ({value === "all" ? usersQuery.data?.length ?? 0 : usersQuery.data?.filter((user) => user.status === value).length ?? 0})
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: "username", header: "Username", render: (user) => <div><p className="font-semibold text-slate-900">{user.username}</p><p className="text-xs text-slate-500">{user.email}</p></div> },
          { key: "role", header: "Role", render: (user) => user.role },
          { key: "lastLogin", header: "Last Login", render: (user) => formatDateTime(user.lastLogin) },
          { key: "status", header: "Status", render: (user) => <StatusBadge value={user.status} /> },
          { key: "license", header: "License-consuming", render: (user) => (user.consumesLicense ? "Yes" : "No") },
        ]}
        rows={users}
      />
    </div>
  );
}
