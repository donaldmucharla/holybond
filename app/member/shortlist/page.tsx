"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Profile } from "@/types/profile";
import {
  getMyProfile,
  isBlocked,
  myShortlistProfiles,
  removeFromShortlist,
  getOrCreateThread,
} from "@/lib/auth";

function ageFromDob(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
}

export default function ShortlistPage() {
  const me = useMemo(() => getMyProfile(), []);
  const [items, setItems] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function load() {
    setErr("");
    try {
      const list = myShortlistProfiles();

      // Optional: hide blocked profiles (by me)
      const visible = list.filter((p) => !isBlocked(p.id));

      // newest first by createdAt
      visible.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setItems(visible);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load shortlist");
    }
  }

  useEffect(() => {
    if (!me) {
      window.location.href = "/auth/login";
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;

    return items.filter((p) => {
      const hay = [
        p.id,
        p.fullName,
        p.gender,
        p.city,
        p.state,
        p.country,
        p.denomination,
        p.education,
        p.profession,
        p.motherTongue,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [items, q]);

  function onRemove(profileId: string) {
    try {
      setErr("");
      removeFromShortlist(profileId);
      setItems((prev) => prev.filter((p) => p.id !== profileId));
      showToast("Removed from shortlist ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Remove failed");
    }
  }

  function onChat(profileId: string) {
    try {
      setErr("");
      const th = getOrCreateThread(profileId);
      window.location.href = `/member/chat/${th.id}`;
    } catch (e: any) {
      setErr(e?.message ?? "Cannot start chat");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Shortlist</div>
            <div className="mt-2 text-sm text-slate-400">
              Profiles you saved. You can remove anytime.
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/search" className={btnGhost}>
              Search
            </Link>
            <Link href="/member" className={btnGhost}>
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className={inputCls}
            placeholder="Search shortlist by name, city, profession..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className={btnGhost} type="button" onClick={load}>
            Refresh
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
          No shortlisted profiles.
          <div className="mt-2 text-sm text-slate-400">
            Browse profiles and click <span className="text-white">Shortlist</span>.
          </div>
          <div className="mt-5">
            <Link href="/search" className={btnPrimary}>
              Go to Search
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const img = p.photos?.[0] ?? "";
            const loc = [p.city, p.state, p.country].filter(Boolean).join(", ");
            const age = ageFromDob(p.dob);

            return (
              <div
                key={p.id}
                className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden"
              >
                <div className="relative h-44 bg-slate-950/40">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No photo
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-slate-200">
                    {p.id}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <div className="text-white font-semibold text-lg truncate">{p.fullName}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {p.gender} • {age} yrs {loc ? `• ${loc}` : ""}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {(p.profession || "—")} {p.education ? `• ${p.education}` : ""}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/u/${p.id}`} className={btnGhost}>
                      View
                    </Link>
                    <button className={btnPrimary} onClick={() => onChat(p.id)} type="button">
                      Chat
                    </button>
                  </div>

                  <button className={btnDanger} onClick={() => onRemove(p.id)} type="button">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
