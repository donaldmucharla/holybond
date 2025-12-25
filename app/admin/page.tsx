"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";
import {
  getSession,
  listPendingProfiles,
  listProfilesAdmin,
} from "@/lib/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [pending, setPending] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace(`/admin/login?next=${encodeURIComponent("/admin")}`);
      return;
    }
    if (s.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    setLoading(true);
    try {
      setPending(listPendingProfiles());
      setAllProfiles(listProfilesAdmin());
    } finally {
      setLoading(false);
    }
  }, [router]);

  const counts = useMemo(() => {
    const approved = allProfiles.filter((p) => p.status === "APPROVED").length;
    const rejected = allProfiles.filter((p) => p.status === "REJECTED").length;
    const pendingCount = allProfiles.filter((p) => p.status === "PENDING").length;
    return { approved, rejected, pending: pendingCount };
  }, [allProfiles]);

  const approvedProfiles = useMemo(
    () => allProfiles.filter((p) => p.status === "APPROVED"),
    [allProfiles]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-white/70">
          Approve profiles, review reports, manage users, and see all approved profiles.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">Pending</div>
            <div className="mt-2 text-3xl font-bold">{counts.pending}</div>
            <div className="mt-1 text-sm text-white/60">Waiting for approval</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">Approved</div>
            <div className="mt-2 text-3xl font-bold">{counts.approved}</div>
            <div className="mt-1 text-sm text-white/60">Visible in search</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">Rejected</div>
            <div className="mt-2 text-3xl font-bold">{counts.rejected}</div>
            <div className="mt-1 text-sm text-white/60">Not visible</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link
            href="/admin/approvals"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold hover:bg-white/10"
          >
            Review Pending Approvals →
          </Link>

          <Link
            href="/admin/users"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold hover:bg-white/10"
          >
            Manage Users →
          </Link>

          <Link
            href="/admin/reports"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold hover:bg-white/10"
          >
            Review Reports →
          </Link>

          <Link
            href="/admin/photos"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold hover:bg-white/10"
          >
            Review Photos →
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pending approvals</h2>
            <p className="text-sm text-slate-600">
              Quickly check who is waiting, then approve/reject from the approvals page.
            </p>
          </div>
          <Link
            href="/admin/approvals"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Open Approvals
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-slate-600">Loading…</div>
        ) : pending.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No pending profiles right now.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 8).map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{p.gender}</td>
                    <td className="px-4 py-3 text-slate-700">{p.city}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Approved profiles</h2>
            <p className="text-sm text-slate-600">
              These profiles are visible on Search.
            </p>
          </div>
          <Link
            href="/search"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            View Search
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-slate-600">Loading…</div>
        ) : approvedProfiles.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No approved profiles yet.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody>
                {approvedProfiles.slice(0, 12).map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{p.gender}</td>
                    <td className="px-4 py-3 text-slate-700">{p.city}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
