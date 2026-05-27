import { Building2, Gauge, LayoutDashboard, PhoneCall, PlusCircle, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const { isAdmin } = useAuth();
  const items = [
    { to: "/", label: "Portal Dashboard", icon: LayoutDashboard },
    { to: "/tenants", label: "Tenant Directory", icon: Building2 },
    { to: "/dids", label: "DID Management", icon: PhoneCall },
    ...(isAdmin
      ? [
          { to: "/tenants/new", label: "Create Tenant", icon: PlusCircle },
          { to: "/admin", label: "Ops Admin", icon: Gauge },
          { to: "/admin/access", label: "User Logins", icon: Settings2 },
        ]
      : []),
  ];

  return (
    <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-hidden bg-[linear-gradient(180deg,#081126_0%,#0b1f44_52%,#07152b_100%)] px-5 py-6 text-white">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,rgba(0,214,255,0.38),transparent_42%),radial-gradient(circle_at_top_right,rgba(221,0,132,0.28),transparent_38%)]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full border-[28px] border-[#d30e87]/80 opacity-70" />
      <div className="absolute right-[-5.5rem] top-52 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(82,201,48,0.26),transparent_58%)] blur-2xl" />

      <div className="relative rounded-[2rem] border border-white/12 bg-white/6 p-5 shadow-2xl shadow-sky-950/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#d30e87_0%,#52c930_100%)] p-3 shadow-lg shadow-fuchsia-950/30">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-[0.28em] text-white">
              <span className="text-[#d30e87]">YA</span>
              <span className="text-[#52c930]">XXA</span>
            </p>
            <p className="text-sm font-semibold text-slate-100">Yaxxa Portal View</p>
            <p className="text-xs text-sky-100/70">Omni tenant operations</p>
          </div>
        </div>
      </div>

      <div className="relative mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white",
                  isActive &&
                    "border border-white/10 bg-[linear-gradient(90deg,rgba(211,14,135,0.82)_0%,rgba(38,128,230,0.86)_55%,rgba(82,201,48,0.72)_100%)] text-white shadow-lg shadow-sky-950/40",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
