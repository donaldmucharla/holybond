"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Profile } from "@/types/profile";
import {
  addToShortlist,
  getMyProfile,
  getSession,
  isShortlisted,
  removeFromShortlist,
  sendInterest,
  isBlocked,
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

export default function ProfileCard({ profile }: { profile: Profile }) {
  const session = getSession();
  const me = getMyProfile();
  const isAdmin = session?.role === "ADMIN";
  const isSelf = me?.id === profile.id;

  const age = useMemo(() => ageFromDob(profile.dob), [profile.dob]);
  const photo = profile.photos?.[0];

  const [shortlisted, setShortlisted] = useState(false);
  const [toast, setToast] = useState("");

  // keep shortlist state accurate on first render
  useEffect(() => {
    setShortlisted(isShortlisted(profile.id));
  }, [profile.id]);

  const blocked = useMemo(() => {
    try {
      return isBlocked(profile.id);
    } catch {
      return false;
    }
  }, [profile.id]);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function requireUser() {
    const s = getSession();
    if (!s) {
      window.location.href = "/auth/login";
      return false;
    }
    if (s.role !== "USER") {
      showToast("Admin cannot do this action.");
      return false;
    }
    return true;
  }

  function onToggleShortlist() {
    if (!requireUser()) return;
    if (isSelf) return showToast("This is your profile.");
    if (blocked) return showToast("You blocked this profile.");

    try {
      if (shortlisted) {
        removeFromShortlist(profile.id);
        setShortlisted(false);
        showToast("Removed from shortlist");
      } else {
        addToShortlist(profile.id);
        setShortlisted(true);
        showToast("Added to shortlist");
      }
    } catch (e: any) {
      showToast(e?.message ?? "Something went wrong", 2200);
    }
  }

  function onSendInterest() {
    if (!requireUser()) return;
    if (isSelf) return showToast("This is your profile.");
    if (blocked) return showToast("You blocked this profile.");

    try {
      sendInterest(profile.id);
      showToast("Interest sent ✅");
    } catch (e: any) {
      showToast(e?.message ?? "Could not send interest", 2200);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
      {/* photo */}
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt="profile"
          className="h-44 w-full rounded-2xl object-cover ring-1 ring-white/10"
        />
      ) : (
        <div className="h-44 w-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-white/10" />
      )}

      {/* header */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-white">
            {profile.fullName} <span className="text-slate-400 font-normal">({age})</span>
          </div>
          <div className="mt-1 truncate text-sm text-slate-400">
            {profile.city}, {profile.state} • {profile.denomination}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs ring-1 ${
            profile.status === "APPROVED"
              ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20"
              : "bg-white/5 text-slate-300 ring-white/10"
          }`}
        >
          {profile.status}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-300">
        <div className="truncate">{profile.education}</div>
        <div className="truncate text-slate-400">{profile.profession}</div>
      </div>

      {blocked ? (
        <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          You blocked this profile.
        </div>
      ) : null}

      {/* actions */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link
          href={`/u/${profile.id}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-white hover:bg-white/10 transition"
        >
          View
        </Link>

        <button
          type="button"
          onClick={onToggleShortlist}
          disabled={isAdmin || isSelf || blocked}
          className={`inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 px-3 text-sm font-medium transition ${
            isAdmin || isSelf || blocked
              ? "bg-white/5 text-slate-500 cursor-not-allowed"
              : "bg-white/5 text-white hover:bg-white/10"
          }`}
        >
          {shortlisted ? "Saved" : "Shortlist"}
        </button>

        <button
          type="button"
          onClick={onSendInterest}
          disabled={isAdmin || isSelf || blocked}
          className={`inline-flex h-11 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${
            isAdmin || isSelf || blocked
              ? "bg-white/10 text-slate-500 cursor-not-allowed"
              : "bg-white text-slate-900 hover:bg-slate-200"
          }`}
        >
          Interest
        </button>
      </div>

      {isAdmin ? (
        <div className="mt-3 text-xs text-slate-500">
          Admin view only. Matchmaking actions are disabled.
        </div>
      ) : null}

      {toast ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
