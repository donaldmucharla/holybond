"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!email.trim()) return setErr("Email is required");
    if (!password.trim()) return setErr("Password is required");

    try {
      setBusy(true);
      const s = login(email.trim(), password);
      router.push(s.role === "ADMIN" ? "/admin" : "/member");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="text-2xl font-semibold text-white">Login</div>
        <div className="mt-2 text-sm text-slate-400">
          Admin seed: <span className="text-slate-200">admin@holybond.in</span> /{" "}
          <span className="text-slate-200">Admin@123</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-4">
        {err ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div>
          <label className="text-xs text-slate-400">Email</label>
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-slate-400">Password</label>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          disabled={busy}
          className={`w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition ${
            busy ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {busy ? "Logging in..." : "Login"}
        </button>

        <div className="text-sm text-slate-400">
          Don’t have an account?{" "}
          <Link className="text-white underline" href="/auth/register">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}
