export function LoadingSkeleton({ className = "h-28" }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-slate-200/70 ${className}`} />;
}
