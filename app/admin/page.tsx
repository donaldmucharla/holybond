"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPendingProfiles, listReports, seedAdminIfMissing } from "@/lib/auth";

const Tile = ({ title, value, sub }: { title: string; value: number; sub: string }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
    <div className="text-sm text-slate-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    <div className="mt-2 text-sm text-slate-400">{sub}</div>
  </div>
);

export default function AdminDashboardPage() {
  const [pending, setPending] = useState(0);
  const [reports, setReports] = useState(0);

  useEffect(() => {
    seedAdminIfMissing();
    try {
      setPending(listPendingProfiles().length);
    } catch {
      setPending(0);
    }
    try {
      setReports(listReports().length);
    } catch {
      setReports(0);
    }
  }, []);

  const btn =
    "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition text-sm";

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="text-2xl font-semibold text-white">Admin Dashboard</div>
        <div className="mt-2 text-sm text-slate-400">
          Approve profiles, review reports, and manage platform safety.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Tile title="Pending Profiles" value={pending} sub="Waiting for approval" />
        <Tile title="Reports" value={reports} sub="Flagged by members" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link className={btn} href="/admin/approvals">
          Go to Approvals
        </Link>
        <Link className={btn} href="/admin/reports">
          Go to Reports
        </Link>
        <Link className={btn} href="/admin/users">
          Manage Users
        </Link>
        <Link className={btn} href="/admin/photos">
          Review Photos
        </Link>
      </div>
    </div>
  );
}
