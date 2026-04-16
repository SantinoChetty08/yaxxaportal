import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Settings,
  CreditCard,
  UserPlus,
  LayoutTemplate,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { TenantStatus } from '../types';
import * as api from '../services/api';

const timezones = [
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Accra',
  'Europe/London',
  'America/New_York',
  'Asia/Dubai',
  'Asia/Kolkata',
];

export function CreateTenantPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    tenant_name: '',
    customer_code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'ACTIVE' as TenantStatus,
    timezone: 'Africa/Johannesburg',
    environment: 'production',
    license_allocation: 10,
    full_name: '',
    admin_username: '',
    admin_email: '',
    admin_role: 'TENANT_ADMIN',
    campaign_template: '',
    queue_template: '',
    did_numbers: '',
    notes: '',
    internal_owner: '',
  });

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.tenant_name.trim()) newErrors.tenant_name = 'Company name is required';
    if (!form.admin_username.trim()) newErrors.admin_username = 'Admin username is required';
    if (!form.admin_email.trim()) newErrors.admin_email = 'Admin email is required';
    if (form.license_allocation < 1) newErrors.license_allocation = 'Must be at least 1';
    if (!form.full_name.trim()) newErrors.full_name = 'Admin full name is required';

    if (step === 1 && !form.tenant_name.trim()) newErrors.tenant_name = 'Required';
    if (step === 4) {
      if (!form.full_name.trim()) newErrors.full_name = 'Required';
      if (!form.admin_username.trim()) newErrors.admin_username = 'Required';
      if (!form.admin_email.trim()) newErrors.admin_email = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep(s => Math.min(7, s + 1));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await api.createTenant({
        ...form,
        did_numbers: form.did_numbers
          ? form.did_numbers.split(',').map(d => d.trim()).filter(Boolean)
          : [],
      });
      setSuccess(result.message);
      setTimeout(() => navigate(`/tenants/${result.tenant_id}`), 2000);
    } catch (e) {
      setErrors({ general: 'Failed to create tenant. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { num: 2, label: 'Setup', icon: <Settings className="w-4 h-4" /> },
    { num: 3, label: 'Licensing', icon: <CreditCard className="w-4 h-4" /> },
    { num: 4, label: 'Admin User', icon: <UserPlus className="w-4 h-4" /> },
    { num: 5, label: 'Defaults', icon: <LayoutTemplate className="w-4 h-4" /> },
    { num: 6, label: 'DIDs', icon: <Phone className="w-4 h-4" /> },
    { num: 7, label: 'Notes', icon: <FileText className="w-4 h-4" /> },
  ];

  const InputField = ({
    label,
    field,
    type = 'text',
    required = false,
    placeholder,
    helpText,
  }: {
    label: string;
    field: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[field as keyof typeof form] as string}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full text-sm bg-white border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400 ${
          errors[field] ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[field]}</p>}
      {helpText && <p className="mt-1 text-xs text-slate-400">{helpText}</p>}
    </div>
  );

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-emerald-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Tenant Created</h2>
          <p className="text-sm text-slate-500 mt-2">{success}</p>
          <p className="text-xs text-slate-400 mt-1">Redirecting to tenant detail…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Tenant</h1>
          <p className="text-sm text-slate-500">Step {step} of 7 — {steps[step - 1].label}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {steps.map(s => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                step === s.num
                  ? 'bg-blue-50 text-blue-700'
                  : step > s.num
                    ? 'text-emerald-600'
                    : 'text-slate-400'
              }`}>
                {step > s.num ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s.num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {s.num}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {s.num < 7 && (
                <div className={`flex-1 h-px mx-1 ${step > s.num ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {/* Step 1: Company */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
            <InputField label="Company Name" field="tenant_name" required placeholder="e.g., Acme Contact Centre" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Customer Code" field="customer_code" placeholder="e.g., ACME-001" />
              <InputField label="Internal Owner" field="internal_owner" placeholder="e.g., Sarah Mitchell" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField label="Contact Person" field="contact_name" placeholder="Name" />
              <InputField label="Contact Email" field="contact_email" type="email" placeholder="email@company.com" />
              <InputField label="Contact Phone" field="contact_phone" placeholder="+27..." />
            </div>
          </div>
        )}

        {/* Step 2: Setup */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Tenant Technical Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status <span className="text-red-500">*</span></label>
                <select
                  value={form.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="TEST">Test</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Environment</label>
                <select
                  value={form.environment}
                  onChange={e => updateField('environment', e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
              <select
                value={form.timezone}
                onChange={e => updateField('timezone', e.target.value)}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Licensing */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">License Allocation</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Allocated Seat Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.license_allocation}
                onChange={e => updateField('license_allocation', parseInt(e.target.value) || 0)}
                min={1}
                className={`w-full max-w-xs text-sm bg-white border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${
                  errors.license_allocation ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.license_allocation && (
                <p className="mt-1 text-xs text-red-500">{errors.license_allocation}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">Minimum 1 license required</p>
            </div>
          </div>
        )}

        {/* Step 4: Admin User */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Initial Admin User</h2>
            <InputField label="Full Name" field="full_name" required placeholder="e.g., Jane Admin" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Username" field="admin_username" required placeholder="jane.admin" />
              <InputField label="Email" field="admin_email" type="email" required placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={form.admin_role}
                onChange={e => updateField('admin_role', e.target.value)}
                className="w-full max-w-xs text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="TENANT_ADMIN">Tenant Admin</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 5: Defaults */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Default Templates (Optional)</h2>
            <InputField label="Campaign Template" field="campaign_template" placeholder="e.g., STANDARD_OUTBOUND" helpText="Leave blank to skip default campaign creation" />
            <InputField label="Queue Template" field="queue_template" placeholder="e.g., STANDARD_SUPPORT" helpText="Leave blank to skip default queue creation" />
          </div>
        )}

        {/* Step 6: DIDs */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">DID Assignment (Optional)</h2>
            <InputField
              label="DID Numbers"
              field="did_numbers"
              placeholder="e.g., +27115550001, +27115550002"
              helpText="Comma-separated list of DID numbers to assign"
            />
          </div>
        )}

        {/* Step 7: Notes */}
        {step === 7 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">Internal Notes</h2>
            <textarea
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Any internal notes or context for this tenant…"
              rows={4}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none placeholder:text-slate-400"
            />

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-5 mt-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Company:</span> <span className="font-medium">{form.tenant_name}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="font-medium">{form.status}</span></div>
                <div><span className="text-slate-500">Licenses:</span> <span className="font-medium">{form.license_allocation}</span></div>
                <div><span className="text-slate-500">Admin:</span> <span className="font-medium">{form.full_name}</span></div>
                <div><span className="text-slate-500">Timezone:</span> <span className="font-medium">{form.timezone}</span></div>
                <div><span className="text-slate-500">Environment:</span> <span className="font-medium">{form.environment}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>
          {step < 7 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Create Tenant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
