import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const usesBackendAuth = import.meta.env.VITE_PORTAL_AUTH_MODE === "backend";

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  return (
    <div className="grid min-h-screen grid-cols-[1.15fr_0.85fr] bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0b1f44_0%,#1776d0_28%,#5dd8ff_62%,#effdff_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(211,14,135,0.85),transparent_14%),radial-gradient(circle_at_72%_48%,rgba(10,58,146,0.35),transparent_24%),linear-gradient(126deg,rgba(255,255,255,0.0)_24%,rgba(255,255,255,0.62)_48%,rgba(255,255,255,0.02)_70%)]" />
        <div className="absolute -left-16 top-[-3rem] h-48 w-48 rounded-full border-[22px] border-[#d30e87]" />
        <div className="absolute left-10 top-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,255,255,0.2)_60%,transparent_72%)] shadow-[0_0_90px_rgba(255,255,255,0.4)]" />
        <div className="absolute left-16 top-[30%] rounded-full bg-white/85 px-8 py-16 shadow-2xl shadow-sky-950/20">
          <p className="text-center text-5xl font-semibold tracking-[0.32em]">
            <span className="text-[#d30e87]">YA</span>
            <span className="text-[#52c930]">XXA</span>
          </p>
        </div>
        <div className="relative flex h-full flex-col justify-end px-16 pb-16 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100/80">Yaxxa Portal View</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight">Secure access for telecom admins and read-only business viewers.</h1>
          <p className="mt-5 max-w-lg text-base text-sky-50/85">
            Sign in before entering the portal. Admin users can create new portal logins, while viewers stay in a safe read-only mode.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-14">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <p className="text-3xl font-semibold tracking-[0.24em]">
              <span className="text-[#d30e87]">YA</span>
              <span className="text-[#52c930]">XXA</span>
            </p>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">
              {usesBackendAuth ? "Use your assigned portal login to continue." : "Use one of the portal credentials below to continue."}
            </p>
          </div>

          {!usesBackendAuth ? (
            <div className="mb-6 grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">Admin demo</p>
                <p className="mt-1">`admin` / `Admin@123`</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">Viewer demo</p>
                <p className="mt-1">`viewer` / `Viewer@123`</p>
              </div>
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setError("");
              try {
                await signIn(username, password);
                navigate(redirectTo, { replace: true });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to sign in.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="field" placeholder="Username" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="field pr-12"
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--portal-primary)] text-sm font-semibold text-white disabled:opacity-50">
              <LogIn className="h-4 w-4" />
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
