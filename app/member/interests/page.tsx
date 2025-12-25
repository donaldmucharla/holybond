"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Interest } from "@/types/interest";
import type { Profile } from "@/types/profile";
import {
  getMyProfile,
  getOrCreateThread,
  getProfileById,
  myReceivedInterests,
  mySentInterests,
  setInterestStatus,
} from "@/lib/auth";

type Tab = "RECEIVED" | "SENT";

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function statusBadge(status: Interest["status"]) {
  if (status === "ACCEPTED") return "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20";
  if (status === "REJECTED") return "bg-red-500/10 text-red-200 ring-red-500/20";
  return "bg-amber-400/10 text-amber-200 ring-amber-400/20";
}

function avatar(profile?: Profile | null) {
  const img = profile?.photos?.[0] ?? "";
  return (
    <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shrink-0">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={profile?.fullName ?? "User"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">No photo</div>
      )}
    </div>
  );
}

export default function InterestsPage() {
  const me = useMemo(() => getMyProfile(), []);
  const [tab, setTab] = useState<Tab>("RECEIVED");
  const [received, setReceived] = useState<Interest[]>([]);
  const [sent, setSent] = useState<Interest[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function load() {
    setErr("");
    try {
      const r = myReceivedInterests();
      const s = mySentInterests();

      // newest first
      r.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      s.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

      setReceived(r);
      setSent(s);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load interests");
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

  const counts = useMemo(() => {
    return {
      received: received.length,
      sent: sent.length,
    };
  }, [received.length, sent.length]);

  const list = tab === "RECEIVED" ? received : sent;

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;

    return list.filter((i) => {
      const otherId = tab === "RECEIVED" ? i.fromProfileId : i.toProfileId;
      const other = getProfileById(otherId);

      const hay = [
        i.id,
        i.status,
        i.message ?? "",
        otherId,
        other?.fullName ?? "",
        other?.city ?? "",
        other?.state ?? "",
        other?.country ?? "",
        other?.profession ?? "",
        other?.denomination ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [list, q, tab]);

  function onAcceptReject(interestId: string, status: "ACCEPTED" | "REJECTED") {
    try {
      setBusyId(interestId);
      setErr("");
      setInterestStatus(interestId, status);
      load();
      showToast(status === "ACCEPTED" ? "Accepted ✅" : "Rejected ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  function onChatWith(profileId: string) {
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
            <div className="text-2xl font-semibold text-white">Interests</div>
            <div className="mt-2 text-sm text-slate-400">
              Manage interest requests. Accept to start chatting.
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/search" className={btnGhost}>
              Search
            </Link>
            <Link href="/member/chat" className={btnGhost}>
              Chat
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search interests by name, location, status..."
          />
          <button className={btnGhost} type="button" onClick={load}>
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className={tabBtn(tab === "RECEIVED")} onClick={() => setTab("RECEIVED")} type="button">
            Received ({counts.received})
          </button>
          <button className={tabBtn(tab === "SENT")} onClick={() => setTab("SENT")} type="button">
            Sent ({counts.sent})
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
          No interests found.
          <div className="mt-2 text-sm text-slate-400">
            Use Search and click <span className="text-white">Send Interest</span>.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => {
            const otherId = tab === "RECEIVED" ? i.fromProfileId : i.toProfileId;
            const other = getProfileById(otherId);
            const loc = [other?.city, other?.state, other?.country].filter(Boolean).join(", ");

            const canChat =
              i.status === "ACCEPTED"; // MVP rule: chat only after acceptance (optional)
            const isPending = i.status === "SENT";

            return (
              <div
                key={i.id}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    {avatar(other)}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-white font-semibold">
                          {other?.fullName ?? otherId}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs ring-1 ${statusBadge(i.status)}`}>
                          {i.status}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {loc || "—"} {other?.profession ? `• ${other.profession}` : ""}
                      </div>

                      {i.message ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
                          {i.message}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-slate-500">No message</div>
                      )}

                      <div className="mt-3 text-xs text-slate-500">
                        {tab === "RECEIVED" ? "Received" : "Sent"}: {fmtTime(i.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/u/${otherId}`} className={btnGhost}>
                      Open Profile
                    </Link>

                    {canChat ? (
                      <button className={btnPrimary} onClick={() => onChatWith(otherId)} type="button">
                        Start Chat
                      </button>
                    ) : (
                      <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        {isPending ? "Awaiting response" : "Chat locked"}
                      </span>
                    )}

                    {tab === "RECEIVED" ? (
                      <>
                        <button
                          className={`${btnPrimary} ${busyId === i.id ? "opacity-60 cursor-not-allowed" : ""}`}
                          onClick={() => onAcceptReject(i.id, "ACCEPTED")}
                          disabled={busyId === i.id}
                          type="button"
                        >
                          Accept
                        </button>
                        <button
                          className={`${btnDanger} ${busyId === i.id ? "opacity-60 cursor-not-allowed" : ""}`}
                          onClick={() => onAcceptReject(i.id, "REJECTED")}
                          disabled={busyId === i.id}
                          type="button"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
