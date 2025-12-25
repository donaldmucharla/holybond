"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";

export default function UserMenu() {
  const router = useRouter();
  const { session, profile } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (profile?.fullName) return profile.fullName;
    if (session?.email) return session.email.split("@")[0] || "Account";
    return "Account";
  }, [profile?.fullName, session?.email]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onLogout() {
    clearSession();
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span className="max-w-[160px] truncate">{displayName}</span>
        <span className="text-slate-500">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="px-4 py-3">
            <div className="truncate text-sm font-semibold text-slate-900">{displayName}</div>
            <div className="truncate text-xs text-slate-600">{session.email}</div>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="p-1">
            <Link
              onClick={() => setOpen(false)}
              href="/member/profile"
              className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Profile
            </Link>
            <Link
              onClick={() => setOpen(false)}
              href="/member/settings"
              className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
