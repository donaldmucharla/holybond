"use client";

import Link from "next/link";
import UserMenu from "@/components/UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              HB
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">HolyBond</div>
              <div className="text-xs text-slate-600">Indian Christian matrimony</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-3 sm:flex">
            <Link
              href="/search"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Search
            </Link>
            <Link
              href="/member/dashboard"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Member
            </Link>
          </nav>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
