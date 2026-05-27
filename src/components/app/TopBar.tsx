import { Bell, ChevronRight, LogOut, Search, UserCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");

  const crumbs = useMemo(
    () =>
      location.pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.split("-").join(" ")),
    [location.pathname],
  );

  return (
    <header className="sticky top-0 z-20 border-b border-sky-100/70 bg-white/72 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-8 py-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            <span>Yaxxa Portal View</span>
            {crumbs.map((crumb) => (
              <span key={crumb} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                <span className="capitalize">{crumb}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate(`/tenants?q=${encodeURIComponent(query)}`);
            }}
            className="relative hidden min-[1100px]:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tenants, domains, DIDs, campaigns, admins"
              className="h-11 w-[28rem] rounded-2xl border border-sky-100 bg-white/90 pl-10 pr-4 text-sm outline-none focus:border-[var(--portal-primary)] focus:ring-4 focus:ring-[var(--portal-primary-soft)]"
            />
          </form>
          <button className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-slate-500">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/90 px-3 py-2 shadow-sm">
            <UserCircle2 className="h-8 w-8 text-[var(--portal-primary)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role} access</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              navigate("/sign-in");
            }}
            className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-slate-500"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
