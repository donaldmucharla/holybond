"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { adminSetProfileStatus, listProfilesAdmin } from "@/lib/auth";

type StatusTab = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function ageFromDob(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
}

function badge(status: string) {
  if (status === "APPROVED") return "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20";
  if (status === "REJECTED") return "bg-red-500/10 text-red-200 ring-red-500/20";
  return "bg-amber-400/10 text-amber-200 ring-amber-400/20";
}

export default function AdminApprovalsPage() {
  const [all, setAll] = useState<Profile[]>([]);
  const [tab, setTab] = useState<StatusTab>("PENDING");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const toastTimer = useRef<number | null>(null);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), ms);
  }

  function load() {
    setErr("");
    try {
      const profiles = listProfilesAdmin();
      profiles.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setAll(profiles);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profiles");
    }
  }

  useEffect(() => {
    load();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const pending = all.filter((p) => p.status === "PENDING").length;
    const approved = all.filter((p) => p.status === "APPROVED").length;
    const rejected = all.filter((p) => p.status === "REJECTED").length;
    return { pending, approved, rejected, all: all.length };
  }, [all]);

  const filtered = useMemo(() => {
    let list = [...all];

    // tab filter
    if (tab !== "ALL") list = list.filter((p) => p.status === tab);

    // search filter
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((p) => {
        const hay = [
          p.id,
          p.fullName,
          p.gender,
          p.dob,
          p.city,
          p.state,
          p.country,
          p.education,
          p.profession,
          p.denomination,
          p.motherTongue,
          p.aboutMe,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(qq);
      });
    }

    return list;
  }, [all, tab, q]);

  function openModal(p: Profile) {
    setSelected(p);
    setOpen(true);
    setErr("");
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    setErr("");
  }

  function onSetStatus(profileId: string, status: "APPROVED" | "REJECTED") {
    try {
      setBusy(true);
      setErr("");
      const updated = adminSetProfileStatus(profileId, status);

      setAll((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));

      showToast(status === "APPROVED" ? "Approved ✅" : "Rejected ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";

  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  const btnPrimary =
    "rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";

  const btnDanger =
    "rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-200 hover:bg-red-500/15 transition";

  const tabBtn = (active: boolean) =>
    `rounded-2xl px-4 py-2 text-sm transition ring-1 ${
      active
        ? "bg-white text-slate-900 ring-white/10"
        : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Approvals</div>
            <div className="mt-2 text-sm text-slate-400">
              Review profiles and approve or reject. Search + preview before approving.
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/reports" className={btnGhost}>
              Reports
            </Link>
            <Link href="/admin/users" className={btnGhost}>
              Users
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className={inputCls}
            placeholder="Search: name, HB id, location, denomination, profession..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <button className={btnGhost} type="button" onClick={load}>
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={tabBtn(tab === "PENDING")} onClick={() => setTab("PENDING")} type="button">
            Pending ({counts.pending})
          </button>
          <button className={tabBtn(tab === "APPROVED")} onClick={() => setTab("APPROVED")} type="button">
            Approved ({counts.approved})
          </button>
          <button className={tabBtn(tab === "REJECTED")} onClick={() => setTab("REJECTED")} type="button">
            Rejected ({counts.rejected})
          </button>
          <button className={tabBtn(tab === "ALL")} onClick={() => setTab("ALL")} type="button">
            All ({counts.all})
          </button>
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

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          No profiles found for this filter.
          <div className="mt-2 text-sm text-slate-400">Try changing the status tab or search keyword.</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const img = p.photos?.[0] ?? "";
            const loc = [p.city, p.state, p.country].filter(Boolean).join(", ");
            const age = ageFromDob(p.dob);

            // ✅ IMPORTANT FIX:
            // outer wrapper is a DIV (NOT a button), so inner Approve/Reject buttons are valid.
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => openModal(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openModal(p);
                }}
                className="text-left rounded-[28px] border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-white font-semibold">{p.fullName}</div>
                      <span className={`rounded-full px-3 py-1 text-xs ring-1 ${badge(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-slate-400">
                      {p.gender} • {age} yrs {loc ? `• ${loc}` : ""}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {p.id} • Created {fmtTime(p.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Quick actions for pending */}
                {p.status === "PENDING" ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      className={`${btnPrimary} py-2 px-4 ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetStatus(p.id, "APPROVED");
                      }}
                      disabled={busy}
                    >
                      Approve
                    </button>
                    <button
                      className={`${btnDanger} py-2 px-4 ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetStatus(p.id, "REJECTED");
                      }}
                      disabled={busy}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-slate-500">Click to view details</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {open && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-white font-semibold text-lg">{selected.fullName}</div>
                  <span className={`rounded-full px-3 py-1 text-xs ring-1 ${badge(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {selected.id} • Created {fmtTime(selected.createdAt)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selected.status === "PENDING" ? (
                  <>
                    <button
                      className={`${btnPrimary} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => onSetStatus(selected.id, "APPROVED")}
                      disabled={busy}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className={`${btnDanger} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => onSetStatus(selected.id, "REJECTED")}
                      disabled={busy}
                      type="button"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                <button className={btnGhost} onClick={closeModal} type="button">
                  Close
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="grid gap-6 p-5 lg:grid-cols-[360px_1fr]">
              {/* Photos */}
              <div className="space-y-3">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
                  {selected.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.photos[0]} alt="primary" className="h-64 w-full object-cover" />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                      No photo uploaded
                    </div>
                  )}
                </div>

                {selected.photos && selected.photos.length > 1 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photos.slice(0, 6).map((src, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`t-${i}`} className="h-20 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <div className="text-white font-semibold text-sm">Quick Info</div>
                  <div className="mt-2 text-slate-400">
                    {selected.gender} • {ageFromDob(selected.dob)} yrs
                  </div>
                  <div className="mt-1 text-slate-400">
                    {[selected.city, selected.state, selected.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                    <span className="text-slate-500">Denomination:</span> {selected.denomination || "—"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                    <span className="text-slate-500">Mother Tongue:</span> {selected.motherTongue || "—"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                    <span className="text-slate-500">Education:</span> {selected.education || "—"}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                    <span className="text-slate-500">Profession:</span> {selected.profession || "—"}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-white font-semibold text-sm">About</div>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
                    {selected.aboutMe || "—"}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-white font-semibold text-sm">Partner Preference</div>
                  <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
                    {selected.partnerPreference || "—"}
                  </div>
                </div>

                {err ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {err}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
