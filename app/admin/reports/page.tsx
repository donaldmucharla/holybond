"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminMarkReportReviewed,
  getProfileById,
  listReports,
} from "@/lib/auth";

type Report = {
  id: string;
  reporterProfileId: string;
  reportedProfileId: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

type StatusTab = "OPEN" | "REVIEWED" | "ALL";

function fmt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function clip(s: string, n = 160) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<StatusTab>("OPEN");

  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Report | null>(null);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function load() {
    setErr("");
    try {
      const r = listReports() as Report[];
      r.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setReports(r);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load reports");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...reports];

    if (tab === "OPEN") list = list.filter((r) => !r.reviewedAt);
    if (tab === "REVIEWED") list = list.filter((r) => !!r.reviewedAt);

    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((r) => {
        const reported = getProfileById(r.reportedProfileId);
        const reporter = getProfileById(r.reporterProfileId);

        const hay = [
          r.id,
          r.reportedProfileId,
          r.reporterProfileId,
          r.reason,
          reported?.fullName,
          reporter?.fullName,
          reported?.city,
          reported?.state,
          reported?.country,
          r.reviewedBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(qq);
      });
    }

    return list;
  }, [reports, tab, q]);

  function openModal(r: Report) {
    setActive(r);
    setOpen(true);
  }

  function closeModal() {
    setActive(null);
    setOpen(false);
  }

  function onMarkReviewed(reportId: string) {
    try {
      setErr("");
      setBusyId(reportId);
      const updated = adminMarkReportReviewed(reportId) as Report;

      setReports((prev) => prev.map((x) => (x.id === reportId ? updated : x)));
      setActive((p) => (p && p.id === reportId ? updated : p));

      showToast("Marked reviewed ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to mark reviewed");
    } finally {
      setBusyId(null);
    }
  }

  const btnTab =
    "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition";
  const btnTabActive =
    "rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10";

  const btnPrimary =
    "rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";
  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition";

  function pillReviewed(r: Report) {
    return r.reviewedAt
      ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20"
      : "bg-amber-400/15 text-amber-200 ring-amber-400/20";
  }

  function labelReviewed(r: Report) {
    return r.reviewedAt ? "REVIEWED" : "OPEN";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Reports</div>
            <div className="mt-2 text-sm text-slate-400">
              Review user reports and mark them as reviewed. Search by name, profile id, or reason.
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className={tab === "OPEN" ? btnTabActive : btnTab} onClick={() => setTab("OPEN")}>
                Open
              </button>
              <button className={tab === "REVIEWED" ? btnTabActive : btnTab} onClick={() => setTab("REVIEWED")}>
                Reviewed
              </button>
              <button className={tab === "ALL" ? btnTabActive : btnTab} onClick={() => setTab("ALL")}>
                All
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button className={btnGhost} onClick={load} type="button">
              Refresh
            </button>
            <Link className={btnGhost} href="/admin/approvals">
              Approvals
            </Link>
          </div>
        </div>

        {toast ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            {toast}
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}
      </div>

      {/* Search */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className={inputCls}
          placeholder="Search report id / profile id / name / reason..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <div>
            Showing <span className="text-white font-semibold">{filtered.length}</span> reports
          </div>

          <button
            className={btnGhost}
            type="button"
            onClick={() => {
              setQ("");
              setTab("OPEN");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          No reports found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const reported = getProfileById(r.reportedProfileId);
            const reporter = getProfileById(r.reporterProfileId);

            return (
              <div key={r.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-white font-semibold">
                      Report #{r.id}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Reported:{" "}
                      <span className="text-slate-200">
                        {reported?.fullName ?? r.reportedProfileId}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Reporter: {reporter?.fullName ?? r.reporterProfileId}
                    </div>
                  </div>

                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs ring-1 ${pillReviewed(r)}`}>
                    {labelReviewed(r)}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Created: {fmt(r.createdAt)}
                  {r.reviewedAt ? (
                    <>
                      <br />
                      Reviewed: {fmt(r.reviewedAt)} {r.reviewedBy ? `by ${r.reviewedBy}` : ""}
                    </>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200">
                  <div className="text-xs text-slate-500">Reason</div>
                  <div className="mt-1">{clip(r.reason, 170) || "—"}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className={btnGhost} onClick={() => openModal(r)} type="button">
                    Open
                  </button>

                  {r.reviewedAt ? (
                    <Link className={btnGhost} href={`/u/${r.reportedProfileId}`}>
                      View Profile
                    </Link>
                  ) : (
                    <button
                      className={`${btnPrimary} ${busyId === r.id ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => onMarkReviewed(r.id)}
                      disabled={busyId === r.id}
                      type="button"
                    >
                      {busyId === r.id ? "..." : "Mark Reviewed"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {open && active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-white">
                  Report #{active.id}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Created: {fmt(active.createdAt)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link className={btnGhost} href={`/u/${active.reportedProfileId}`}>
                  Open Profile
                </Link>

                {!active.reviewedAt ? (
                  <button
                    className={`${btnPrimary} ${busyId === active.id ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={() => onMarkReviewed(active.id)}
                    disabled={busyId === active.id}
                    type="button"
                  >
                    {busyId === active.id ? "..." : "Mark Reviewed"}
                  </button>
                ) : null}

                <button className={btnGhost} onClick={closeModal} type="button">
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {(() => {
                const reported = getProfileById(active.reportedProfileId);
                const reporter = getProfileById(active.reporterProfileId);
                return (
                  <>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-semibold text-white">Profiles</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-300">
                        <div>
                          <span className="text-slate-500">Reported:</span>{" "}
                          <span className="text-slate-200">
                            {reported?.fullName ?? active.reportedProfileId}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Reporter:</span>{" "}
                          <span className="text-slate-200">
                            {reporter?.fullName ?? active.reporterProfileId}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Location:</span>{" "}
                          <span className="text-slate-200">
                            {reported
                              ? [reported.city, reported.state, reported.country].filter(Boolean).join(", ")
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-semibold text-white">Reason</div>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
                        {active.reason || "—"}
                      </div>

                      {active.reviewedAt ? (
                        <div className="mt-3 text-xs text-slate-500">
                          Reviewed: {fmt(active.reviewedAt)} {active.reviewedBy ? `by ${active.reviewedBy}` : ""}
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
