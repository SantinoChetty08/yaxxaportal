import { cn } from "@/utils/cn";

const tones: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  suspended: "bg-amber-50 text-amber-700 ring-amber-200",
  test: "bg-sky-50 text-sky-700 ring-sky-200",
  decommissioned: "bg-slate-100 text-slate-600 ring-slate-200",
  free: "bg-slate-100 text-slate-700 ring-slate-200",
  reserved: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  quarantined: "bg-rose-50 text-rose-700 ring-rose-200",
  connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
  disabled: "bg-slate-100 text-slate-600 ring-slate-200",
  paused: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-600 ring-slate-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
        tones[value] ?? "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {value.split("_").join(" ")}
    </span>
  );
}
