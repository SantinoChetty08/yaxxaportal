import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";

export function TabNav({
  items,
}: {
  items: Array<{ label: string; to: string; end?: boolean }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "rounded-2xl px-4 py-2 text-sm font-medium transition",
              isActive ? "bg-slate-950 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
