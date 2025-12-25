"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProfileById, listUsersAdmin } from "@/lib/auth";

type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  profileId: string;
  createdAt: string;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function AdminUsersPage() {
  const [all, setAll] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setErr("");
    try {
      const users = listUsersAdmin() as AdminUser[];
      users.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setAll(users);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load users");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return all;

    return all.filter((u) => {
      const p = getProfileById(u.profileId);
      const hay = [
        u.id,
        u.email,
        u.role,
        u.profileId,
        p?.fullName ?? "",
        p?.city ?? "",
        p?.state ?? "",
        p?.country ?? "",
        p?.status ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [all, q]);

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";

  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Users</div>
            <div className="mt-2 text-sm text-slate-400">
              Search by <span className="text-white">User ID</span>, <span className="text-white">Email</span>, or{" "}
              <span className="text-white">Profile ID</span>.
            </div>
          </div>

          <button className={btnGhost} onClick={load} type="button">
            Refresh
          </button>
        </div>

        <div className="mt-4">
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: U-XXXX / admin@... / HB-1234 / name / city..."
          />
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-4 text-sm text-slate-300">
          Showing <span className="text-white font-semibold">{filtered.length}</span> users
        </div>
      </div>

      {/* Table-ish list */}
      <div className="space-y-3">
        {filtered.map((u) => {
          const p = getProfileById(u.profileId);
          const name = p?.fullName ?? "—";
          const status = p?.status ?? "—";

          return (
            <div key={u.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">
                    {name}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      ({u.role})
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-400">
                    <div>
                      <span className="text-slate-500">User ID:</span>{" "}
                      <span className="text-slate-200">{u.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>{" "}
                      <span className="text-slate-200">{u.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Profile ID:</span>{" "}
                      <span className="text-slate-200">{u.profileId}</span>{" "}
                      <span className="text-slate-500">• Status:</span>{" "}
                      <span className="text-slate-200">{status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Created: {fmtTime(u.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link className={btnGhost} href={`/admin/users/${u.id}`}>
                    View User
                  </Link>

                  <Link className={btnGhost} href={`/u/${u.profileId}`}>
                    View Profile
                  </Link>

                  <Link className={btnGhost} href={`/admin/users/${u.id}/edit`}>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
