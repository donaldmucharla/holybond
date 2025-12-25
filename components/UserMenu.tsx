"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSession, getMyProfile, logout } from "@/lib/auth";

type Role = "USER" | "ADMIN";

export default function UserMenu() {
  const pathname = usePathname(); // ✅ updates on every navigation
  const [ready, setReady] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const [role, setRole] = React.useState<Role | null>(null);
  const [label, setLabel] = React.useState<string>("Account");

  const sync = React.useCallback(() => {
    const s = getSession();

    if (!s) {
      setRole(null);
      setLabel("Account");
      setReady(true);
      return;
    }

    setRole(s.role);

    if (s.role === "USER") {
      const p = getMyProfile();
      setLabel(p?.fullName?.trim() ? p.fullName : s.email);
    } else {
      setLabel("Admin");
    }

    setReady(true);
  }, []);

  // ✅ Run once on mount
  React.useEffect(() => {
    sync();
  }, [sync]);

  // ✅ Run again on every route change (after login redirect, etc.)
  React.useEffect(() => {
    sync();
    setOpen(false);
  }, [pathname, sync]);

  // ✅ close dropdown when clicking outside
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-usermenu]")) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function doLogout() {
    logout();
    window.location.href = "/";
  }

  // ✅ avoid flicker
  if (!ready) return <div className="h-9 w-[170px]" />;

  // Not logged in
  if (!role) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
        >
          Register Free
        </Link>
      </div>
    );
  }

  // Logged in
  return (
    <div className="relative" data-usermenu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
      >
        <span className="max-w-[150px] truncate">{label}</span>
        <span className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-xl">
          <div className="px-4 py-3 text-xs text-slate-400 border-b border-white/10">
            Signed in
          </div>

          {role === "USER" ? (
            <>
              <Link href="/member" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Dashboard
              </Link>
              <Link href="/member/profile" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                My Profile
              </Link>
              <Link href="/member/settings" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Settings
              </Link>
              <Link href="/member/shortlist" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Shortlist
              </Link>
              <Link href="/member/interests" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Interests
              </Link>
              <Link href="/member/chat" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Chat
              </Link>
            </>
          ) : (
            <>
              <Link href="/admin" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Admin Dashboard
              </Link>
              <Link href="/admin/approvals" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Approvals
              </Link>
              <Link href="/admin/reports" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Reports
              </Link>
              <Link href="/admin/users" className="block px-4 py-3 text-sm text-white hover:bg-white/10">
                Users
              </Link>
            </>
          )}

          <div className="border-t border-white/10">
            <button
              type="button"
              onClick={doLogout}
              className="w-full px-4 py-3 text-left text-sm text-red-200 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
