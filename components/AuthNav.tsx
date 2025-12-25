"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/lib/auth";

export default function AuthNav() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);

  useEffect(() => {
    setMounted(true);
    const s = getSession();
    setRole(s?.role ?? null);
  }, []);

  function onLogout() {
    logout();
    window.location.href = "/";
  }

  // Prevent SSR mismatch
  if (!mounted) return null;

  if (!role) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
        >
          Register Free
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {role === "USER" ? (
        <Link
          href="/member/profile"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          My Profile
        </Link>
      ) : (
        <Link
          href="/admin"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Admin
        </Link>
      )}

      <button
        type="button"
        onClick={onLogout}
        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
      >
        Logout
      </button>
    </div>
  );
}
