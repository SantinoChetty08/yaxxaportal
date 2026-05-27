import { useOutletContext } from "react-router-dom";
import { Card } from "@/components/shared/Card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { Tenant } from "@/types";

export function TenantIntegrationsPage() {
  const { tenant } = useOutletContext<{ tenant: Tenant }>();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">API status</h2>
        <div className="mt-4 flex items-center gap-3">
          <StatusBadge value={tenant.apiStatus} />
          <span className="text-sm text-slate-500">Last sync: {formatDateTime(tenant.lastSyncAt)}</span>
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">API token</p>
          <p className="mt-2 font-mono text-sm text-slate-700">{tenant.apiTokenMasked}</p>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-950">Integration flags</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(tenant.integrationFlags).map(([flag, enabled]) => (
            <label key={flag} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="capitalize">{flag.replace(/([A-Z])/g, " $1")}</span>
              <input checked={enabled} readOnly type="checkbox" className="h-4 w-4 accent-[var(--portal-primary)]" />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
