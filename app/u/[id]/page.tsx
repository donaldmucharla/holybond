"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";
import {
  addToShortlist,
  blockProfile,
  getMyProfile,
  getProfileById,
  getOrCreateThread,
  getSession,
  isBlocked,
  isShortlisted,
  removeFromShortlist,
  reportProfile,
  sendInterest,
  unblockProfile,
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

function clip(s: string, n = 220) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const session = useMemo(() => getSession(), []);
  const me = useMemo(() => getMyProfile(), []);

  const [p, setP] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [shortlisted, setShortlisted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Interest modal
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMsg, setInterestMsg] = useState("");

  // Report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function load() {
    setErr("");
    setNotFound(false);

    const prof = getProfileById(id);
    if (!prof) {
      setNotFound(true);
      setP(null);
      return;
    }

    setP(prof);

    // Only USER can shortlist/block; admin shouldn't participate
    if (session?.role === "USER") {
      setShortlisted(isShortlisted(prof.id));
      setBlocked(isBlocked(prof.id));
    } else {
      setShortlisted(false);
      setBlocked(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isAdmin = session?.role === "ADMIN";
  const isUser = session?.role === "USER";
  const isMe = !!(me && p && me.id === p.id);

  // Visibility rules:
  // - Public users should see only APPROVED profiles (unless viewing own profile).
  // - Admin can view any profile (but no match actions).
  const canView =
    !!p &&
    (p.status === "APPROVED" || isAdmin || isMe);

  const btnPrimary =
    "rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";
  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";
  const btnDanger =
    "rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-200 hover:bg-red-500/15 transition";

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10";

  function requireUser(action: () => void) {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (session.role !== "USER") {
      showToast("Admin cannot use matchmaking actions");
      return;
    }
    action();
  }

  function onToggleShortlist() {
    if (!p) return;
    requireUser(() => {
      try {
        setBusy(true);
        if (shortlisted) {
          removeFromShortlist(p.id);
          setShortlisted(false);
          showToast("Removed from shortlist ✅");
        } else {
          addToShortlist(p.id);
          setShortlisted(true);
          showToast("Added to shortlist ✅");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed");
      } finally {
        setBusy(false);
      }
    });
  }

  function onStartChat() {
    if (!p) return;
    requireUser(() => {
      try {
        if (blocked) {
          showToast("Unblock to chat");
          return;
        }
        setBusy(true);
        const th = getOrCreateThread(p.id);
        router.push(`/member/chat/${th.id}`);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to start chat");
      } finally {
        setBusy(false);
      }
    });
  }

  function onSendInterest() {
    if (!p) return;
    requireUser(() => {
      if (blocked) {
        showToast("Unblock to send interest");
        return;
      }
      setInterestOpen(true);
      setInterestMsg("");
    });
  }

  function confirmSendInterest() {
    if (!p) return;
    try {
      setBusy(true);
      sendInterest(p.id, interestMsg.trim() || undefined);
      setInterestOpen(false);
      showToast("Interest sent ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send interest");
    } finally {
      setBusy(false);
    }
  }

  function onReport() {
    if (!p) return;
    requireUser(() => {
      setReportOpen(true);
      setReportReason("");
    });
  }

  function confirmReport() {
    if (!p) return;
    const reason = reportReason.trim();
    if (!reason) {
      setErr("Please enter a reason");
      return;
    }
    try {
      setBusy(true);
      reportProfile(p.id, reason);
      setReportOpen(false);
      showToast("Report submitted ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to report");
    } finally {
      setBusy(false);
    }
  }

  function onToggleBlock() {
    if (!p) return;
    requireUser(() => {
      try {
        setBusy(true);
        if (blocked) {
          unblockProfile(p.id);
          setBlocked(false);
          showToast("Unblocked ✅");
        } else {
          blockProfile(p.id);
          setBlocked(true);
          showToast("Blocked ✅");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed");
      } finally {
        setBusy(false);
      }
    });
  }

  // ---------- UI STATES ----------
  if (notFound) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
        Profile not found.
        <div className="mt-4">
          <Link href="/search" className={btnPrimary}>
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading...
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
        This profile is not available right now.
        <div className="mt-2 text-sm text-slate-400">
          Only approved profiles are public.
        </div>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/search" className={btnGhost}>
            Back
          </Link>
          {isAdmin ? (
            <Link href="/admin/approvals" className={btnPrimary}>
              Go to Approvals
            </Link>
          ) : (
            <Link href="/auth/login" className={btnPrimary}>
              Login
            </Link>
          )}
        </div>
      </div>
    );
  }

  const img = p.photos?.[0] ?? "";
  const loc = [p.city, p.state, p.country].filter(Boolean).join(", ");
  const age = ageFromDob(p.dob);

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-20 w-20 overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/40 shrink-0">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={p.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-2xl font-semibold text-white">{p.fullName}</div>
              <div className="mt-2 text-sm text-slate-400">
                {p.gender} • {age} yrs {loc ? `• ${loc}` : ""}
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-black/30 px-3 py-1 text-slate-200 ring-1 ring-white/10">
                  {p.id}
                </span>

                {p.status !== "APPROVED" ? (
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-200 ring-1 ring-amber-400/20">
                    {p.status}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/search" className={btnGhost}>
              Back to Search
            </Link>

            {/* Admin note */}
            {isAdmin ? (
              <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Admin view (actions disabled)
              </span>
            ) : null}

            {/* If logged out */}
            {!session ? (
              <Link href="/auth/login" className={btnPrimary}>
                Login to Connect
              </Link>
            ) : null}
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

      {/* If blocked banner */}
      {isUser && blocked ? (
        <div className="rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-6 text-amber-200">
          <div className="font-semibold text-white">You blocked this profile.</div>
          <div className="mt-2 text-sm text-amber-100">
            Unblock to send interest or chat.
          </div>
          <div className="mt-4">
            <button className={btnPrimary} onClick={onToggleBlock} disabled={busy} type="button">
              {busy ? "..." : "Unblock"}
            </button>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">Actions</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`${btnGhost} ${(!isUser || busy || isMe) ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onToggleShortlist}
            disabled={!isUser || busy || isMe}
            type="button"
          >
            {shortlisted ? "Remove Shortlist" : "Add Shortlist"}
          </button>

          <button
            className={`${btnPrimary} ${(!isUser || busy || blocked || isMe) ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onSendInterest}
            disabled={!isUser || busy || blocked || isMe}
            type="button"
          >
            Send Interest
          </button>

          <button
            className={`${btnGhost} ${(!isUser || busy || blocked || isMe) ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onStartChat}
            disabled={!isUser || busy || blocked || isMe}
            type="button"
          >
            Start Chat
          </button>

          <button
            className={`${btnGhost} ${(!isUser || busy || isMe) ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onReport}
            disabled={!isUser || busy || isMe}
            type="button"
          >
            Report
          </button>

          <button
            className={`${btnDanger} ${(!isUser || busy || isMe) ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onToggleBlock}
            disabled={!isUser || busy || isMe}
            type="button"
          >
            {blocked ? "Unblock" : "Block"}
          </button>
        </div>

        {!session ? (
          <div className="mt-4 text-sm text-slate-400">
            Login to shortlist, send interest, chat, report or block.
          </div>
        ) : null}

        {isMe ? (
          <div className="mt-4 text-sm text-slate-400">
            This is your profile. Actions are disabled. Use <Link className="text-white underline" href="/member/profile/edit">Edit Profile</Link>.
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="text-sm font-semibold text-white">Basic Info</div>

          <div className="grid gap-2 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span className="text-slate-500">Denomination:</span>{" "}
              <span className="text-slate-200">{p.denomination || "—"}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span className="text-slate-500">Mother Tongue:</span>{" "}
              <span className="text-slate-200">{p.motherTongue || "—"}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span className="text-slate-500">Education:</span>{" "}
              <span className="text-slate-200">{p.education || "—"}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <span className="text-slate-500">Profession:</span>{" "}
              <span className="text-slate-200">{p.profession || "—"}</span>
            </div>
          </div>

          {p.photos && p.photos.length > 1 ? (
            <div className="pt-2">
              <div className="text-xs text-slate-500 mb-2">More Photos</div>
              <div className="grid grid-cols-3 gap-2">
                {p.photos.slice(0, 6).map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`p-${i}`} className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold text-white">About</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
              {p.aboutMe || "—"}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="text-sm font-semibold text-white">Partner Preference</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-200 whitespace-pre-line">
              {p.partnerPreference ? clip(p.partnerPreference, 600) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Interest Modal */}
      {interestOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="text-white font-semibold">Send Interest</div>
              <button className={btnGhost} onClick={() => setInterestOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-400">
                Add an optional message to <span className="text-slate-200">{p.fullName}</span>.
              </div>

              <textarea
                className={`${inputCls} min-h-[130px]`}
                placeholder="Hi! I liked your profile. Would you like to connect?"
                value={interestMsg}
                onChange={(e) => setInterestMsg(e.target.value)}
              />

              <div className="flex gap-2 justify-end">
                <button className={btnGhost} onClick={() => setInterestOpen(false)} type="button">
                  Cancel
                </button>
                <button
                  className={`${btnPrimary} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={confirmSendInterest}
                  disabled={busy}
                  type="button"
                >
                  {busy ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Report Modal */}
      {reportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="text-white font-semibold">Report Profile</div>
              <button className={btnGhost} onClick={() => setReportOpen(false)} type="button">
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-400">
                Why are you reporting <span className="text-slate-200">{p.fullName}</span>?
              </div>

              <textarea
                className={`${inputCls} min-h-[130px]`}
                placeholder="Example: Inappropriate content / spam / fake profile..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />

              <div className="flex gap-2 justify-end">
                <button className={btnGhost} onClick={() => setReportOpen(false)} type="button">
                  Cancel
                </button>
                <button
                  className={`${btnPrimary} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={confirmReport}
                  disabled={busy}
                  type="button"
                >
                  {busy ? "..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
