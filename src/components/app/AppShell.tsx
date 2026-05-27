import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_14%_10%,rgba(211,14,135,0.10),transparent_12%),linear-gradient(120deg,rgba(20,119,208,0.92)_0%,rgba(48,142,228,0.84)_18%,rgba(166,239,255,0.44)_38%,rgba(255,255,255,0.96)_58%,rgba(233,246,255,1)_76%,rgba(245,250,255,1)_100%)]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar />
        <main className="px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
