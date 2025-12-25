"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";
import { getSession, listProfilesAdmin, listUsersAdmin } from "@/lib/auth";

type AdminUserRow = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  profileId: string;
  createdAt: string;
};

type ViewMode = "PENDING" | "APPROVED" | "ALL";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("PENDING");
  const [q, setQ] = useState("");
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
      setProfiles(listProfilesAdmin());
      setUsers(listUsersAdmin() as AdminUserRow[]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const counts = useMemo(() => {
    const pending = profiles.filter((p) => p.status === "PENDING").length;
    const approved = profiles.filter((p) => p.status === "APPROVED").length;
    const rejected = profiles.filter((p) => p.status === "REJECTED").length;
    const totalUsers = users.length;
    const totalMembers = users.filter((u) => u.role === "USER").length;
    const totalAdmins = users.filter((u) => u.role === "ADMIN").length;
    return { pending, approved, rejected, totalUsers, totalMembers, totalAdmins };
  }, [profiles, users]);

  const filteredProfiles = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base =
      mode === "PENDING"
        ? profiles.filter((p) => p.status === "PENDING")
        : mode === "APPROVED"
        ? profiles.filter((p) => p.status === "APPROVED")
        : profiles;

    if (!query) return base;

    return base.filter((p) => {
      const hay = [
        p.id,
        p.fullName,
        p.gender,
        p.city,
        p.state,
        p.country,
        p.education,
        p.profession,
        p.denomination,
        p.motherTongue,
        p.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [profiles, mode, q]);

  const filteredUsers = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      const hay = [u.id, u.email, u.role, u.profileId].join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [users, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-white/70">
              Pending users, approved users, all users, and quick admin actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/approvals"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Approvals
            </Link>
            <Link
              href="/admin/users"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Users
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Reports
            </Link>
            <Link
              href="/admin/photos"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Photos
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">Pending Profiles</div>
            <div className="mt-2 text-3xl font-bold">{counts.pending}</div>
            <div className="mt-1 text-sm text-white/60">Waiting approval</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">Approved Profiles</div>
            <div className="mt-2 text-3xl font-bold">{counts.approved}</div>
            <div className="mt-1 text-sm text-white/60">Visible in Search</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-white/70">All Users</div>
            <div className="mt-2 text-3xl font-bold">{counts.totalUsers}</div>
            <div className="mt-1 text-sm text-white/60">
              Members {counts.totalMembers} • Admins {counts.totalAdmins}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("PENDING")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === "PENDING"
                  ? "bg-white text-slate-900"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Pending users
            </button>
            <button
              type="button"
              onClick={() => setMode("APPROVED")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === "APPROVED"
                  ? "bg-white text-slate-900"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              Approved users
            </button>
            <button
              type="button"
              onClick={() => setMode("ALL")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === "ALL"
                  ? "bg-white text-slate-900"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              All profiles
            </button>
            <Link
              href="/admin/users"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              All users (accounts)
            </Link>
          </div>

          <div className="w-full sm:w-[360px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / id / email / city…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/30"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {mode === "PENDING" ? "Pending profiles" : mode === "APPROVED" ? "Approved profiles" : "All profiles"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {mode === "PENDING"
                    ? "Approve or reject from Approvals page."
                    : mode === "APPROVED"
                    ? "Visible in Search."
                    : "All profiles with status."}
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
            ) : filteredProfiles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                No results.
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.slice(0, 20).map((p) => (
                      <tr key={p.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.fullName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              p.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : p.status === "PENDING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{p.city}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.id}</td>
                        <td className="px-4 py-3">
                          <Link
                            className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                            href={`/u/${encodeURIComponent(p.id)}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/approvals"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Approve / Reject pending
              </Link>
              <Link
                href="/search"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Open Search
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All users (accounts)</h2>
                <p className="mt-1 text-sm text-slate-600">Accounts list for admin.</p>
              </div>
              <Link
                href="/admin/users"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open Users
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 text-sm text-slate-600">Loading…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                No results.
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 12).map((u) => (
                      <tr key={u.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-900">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                            href={`/admin/users/${encodeURIComponent(u.id)}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/admin/approvals"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Pending approvals
              </Link>
              <Link
                href="/admin/users"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                All users
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Reports
              </Link>
              <Link
                href="/admin/photos"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Photos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
