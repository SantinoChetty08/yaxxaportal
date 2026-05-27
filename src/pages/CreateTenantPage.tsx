import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/ToastProvider";
import { createTenant, getPortalMeta } from "@/services/api";

const schema = z.object({
  companyName: z.string().min(2),
  domain: z.string().min(3),
  billingCode: z.string().min(3),
  accountManager: z.string().min(2),
  notes: z.string().optional(),
  tenantId: z.string().min(4),
  dialplanTemplate: z.string().min(2),
  profileTemplate: z.string().min(2),
  licenseSeats: z.coerce.number().min(1),
  channels: z.object({
    voice: z.boolean(),
    email: z.boolean(),
    whatsapp: z.boolean(),
    chat: z.boolean(),
  }),
  adminUsername: z.string().min(3),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminRole: z.enum(["tenant_admin", "supervisor"]),
  createDefaultCampaign: z.boolean(),
  campaignName: z.string().optional(),
  campaignType: z.enum(["inbound", "outbound", "blended", "preview", "power"]).optional(),
  initialDidId: z.string().optional(),
}).refine((value) => !value.createDefaultCampaign || Boolean(value.campaignName && value.campaignType), {
  message: "Campaign name and type are required when initial setup is enabled.",
  path: ["campaignName"],
});

type FormValues = z.infer<typeof schema>;

export function CreateTenantPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const metaQuery = useQuery({ queryKey: ["portal-meta"], queryFn: getPortalMeta });
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      domain: "",
      billingCode: "",
      accountManager: "Sarah Mitchell",
      notes: "",
      tenantId: `HCC-${Math.floor(1011 + Math.random() * 80)}`,
      dialplanTemplate: "Enterprise Inbound",
      profileTemplate: "Standard Ops",
      licenseSeats: 25,
      channels: { voice: true, email: true, whatsapp: false, chat: false },
      adminUsername: "",
      adminEmail: "",
      adminPassword: "",
      adminRole: "tenant_admin",
      createDefaultCampaign: false,
      campaignName: "",
      campaignType: "inbound",
      initialDidId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (tenant) => {
      showToast("Tenant created successfully");
      navigate(`/tenants/${tenant.id}`);
    },
  });

  const values = form.watch();
  const isReadOnlyLiveData = metaQuery.data?.isReadOnlyLiveData ?? false;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Provisioning" title="Create tenant" description="Provision a new HoduCC account, set baseline licensing, and optionally stand up the first campaign and DID." />
      {isReadOnlyLiveData ? (
        <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
          The portal is currently connected to the live MariaDB replica in read-only mode. Tenant creation is disabled until a writable backend is connected.
        </div>
      ) : null}
      <form onSubmit={form.handleSubmit((value) => mutation.mutate({ ...value, notes: value.notes ?? "" }))} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Company info</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Field label="Company name" error={form.formState.errors.companyName?.message}><input {...form.register("companyName")} className="field" /></Field>
            <Field label="Domain" error={form.formState.errors.domain?.message}><input {...form.register("domain")} className="field" /></Field>
            <Field label="Billing code" error={form.formState.errors.billingCode?.message}><input {...form.register("billingCode")} className="field" /></Field>
            <Field label="Account manager" error={form.formState.errors.accountManager?.message}>
              <select {...form.register("accountManager")} className="field">{metaQuery.data?.accountManagers.map((manager) => <option key={manager}>{manager}</option>)}</select>
            </Field>
            <Field label="Notes"><textarea {...form.register("notes")} className="field min-h-24" /></Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Technical settings</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Field label="Tenant ID" error={form.formState.errors.tenantId?.message}><input {...form.register("tenantId")} className="field" /></Field>
            <Field label="Dialplan template"><select {...form.register("dialplanTemplate")} className="field">{metaQuery.data?.dialplanTemplates.map((template) => <option key={template}>{template}</option>)}</select></Field>
            <Field label="Profile template"><select {...form.register("profileTemplate")} className="field">{metaQuery.data?.profileTemplates.map((template) => <option key={template}>{template}</option>)}</select></Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Licensing</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Field label="License seats" error={form.formState.errors.licenseSeats?.message}><input type="number" {...form.register("licenseSeats")} className="field" /></Field>
            <div className="xl:col-span-2 grid grid-cols-2 gap-3">
              {(["voice", "email", "whatsapp", "chat"] as const).map((channel) => (
                <label key={channel} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="capitalize">{channel}</span>
                  <input type="checkbox" {...form.register(`channels.${channel}`)} />
                </label>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-950">Admin user</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Field label="Username" error={form.formState.errors.adminUsername?.message}><input {...form.register("adminUsername")} className="field" /></Field>
            <Field label="Email" error={form.formState.errors.adminEmail?.message}><input {...form.register("adminEmail")} className="field" /></Field>
            <Field label="Password" error={form.formState.errors.adminPassword?.message}>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} {...form.register("adminPassword")} className="field pr-12" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Role"><select {...form.register("adminRole")} className="field"><option value="tenant_admin">Tenant admin</option><option value="supervisor">Supervisor</option></select></Field>
          </div>
        </Card>

        <Card className="p-6">
          <label className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-950">Initial setup</span>
            <input type="checkbox" {...form.register("createDefaultCampaign")} />
          </label>
          {values.createDefaultCampaign && (
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Field label="Campaign name" error={form.formState.errors.campaignName?.message}><input {...form.register("campaignName")} className="field" /></Field>
              <Field label="Campaign type"><select {...form.register("campaignType")} className="field"><option value="inbound">Inbound</option><option value="outbound">Outbound</option><option value="blended">Blended</option><option value="preview">Preview</option><option value="power">Power</option></select></Field>
              <Field label="Initial DID assignment"><select {...form.register("initialDidId")} className="field"><option value="">Select free DID</option>{metaQuery.data?.unassignedDids.map((did) => <option key={did.id} value={did.id}>{did.number}</option>)}</select></Field>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <button type="submit" disabled={isReadOnlyLiveData} className="rounded-2xl bg-[var(--portal-primary)] px-5 py-3 text-sm font-medium text-white disabled:opacity-40">Create tenant</button>
          <button type="button" onClick={() => navigate("/tenants")} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
