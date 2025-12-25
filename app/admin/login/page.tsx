"use client";

import { useState } from "react";
import { login } from "@/lib/auth";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@holybond.in");
  const [password, setPassword] = useState("Admin@123");
  const [msg, setMsg] = useState("");

  function onLogin() {
    try {
      const s = login(email, password);
      if (s.role !== "ADMIN") throw new Error("Not an admin account");
      window.location.href = "/admin/approvals";
    } catch (e: any) {
      setMsg(e?.message ?? "Login failed");
    }
  }

  return (
    <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="text-lg font-semibold text-white">Admin Login</div>
      <div className="mt-4 space-y-3">
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={onLogin} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200">
          Login
        </button>
        {msg ? <div className="text-sm text-red-200">{msg}</div> : null}
      </div>
    </div>
  );
}
