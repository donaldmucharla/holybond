"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  getSession,
  getMyProfile,
  logout,
} from "@/lib/auth";

function readRaw(key: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function safeJSONParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function downloadJSON(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MemberSettingsPage() {
  const session = useMemo(() => getSession(), []);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If no session, go login
    if (!session) window.location.href = "/auth/login";
  }, [session]);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function onLogout() {
    try {
      logout();
      window.location.href = "/auth/login";
    } catch (e: any) {
      setErr(e?.message ?? "Logout failed");
    }
  }

  function onResetAllLocalData() {
    try {
      setBusy(true);
      setErr("");

      // Remove ALL MVP keys (safe wipe)
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));

      showToast("Local data reset ✅");
      // Logout and go home/login
      window.location.href = "/auth/login";
    } catch (e: any) {
      setErr(e?.message ?? "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  function onDownloadMyData() {
    try {
      setBusy(true);
      setErr("");

      const me = getMyProfile();
      if (!me) {
        setErr("Profile not found. Please login again.");
        return;
      }

      // Read all storage (raw)
      const users = safeJSONParse(readRaw(STORAGE_KEYS.USERS), []);
      const profiles = safeJSONParse(readRaw(STORAGE_KEYS.PROFILES), []);
      const shortlist = safeJSONParse(readRaw(STORAGE_KEYS.SHORTLISTS), []);
      const interests = safeJSONParse(readRaw(STORAGE_KEYS.INTERESTS), []);
      const blocks = safeJSONParse(readRaw(STORAGE_KEYS.BLOCKS), []);
      const reports = safeJSONParse(readRaw(STORAGE_KEYS.REPORTS), []);
      const threads = safeJSONParse(readRaw(STORAGE_KEYS.CHAT_THREADS), []);

      // Only keep data relevant to me (USER only)
      const myProfile = me;

      const myShortlist = (shortlist as any[]).filter((x) => x.ownerProfileId === myProfile.id);
      const myInterestsSent = (interests as any[]).filter((x) => x.fromProfileId === myProfile.id);
      const myInterestsReceived = (interests as any[]).filter((x) => x.toProfileId === myProfile.id);
      const myBlocks = (blocks as any[]).filter((x) => x.ownerProfileId === myProfile.id);
      const myReports = (reports as any[]).filter((x) => x.reporterProfileId === myProfile.id);

      const myThreads = (threads as any[]).filter(
        (t) => t.a === myProfile.id || t.b === myProfile.id
      );

      // Include minimal referenced profiles for convenience
      const referencedProfileIds = new Set<string>();
      myShortlist.forEach((x) => referencedProfileIds.add(x.savedProfileId));
      myInterestsSent.forEach((x) => referencedProfileIds.add(x.toProfileId));
      myInterestsReceived.forEach((x) => referencedProfileIds.add(x.fromProfileId));
      myBlocks.forEach((x) => referencedProfileIds.add(x.blockedProfileId));
      myThreads.forEach((t: any) => {
        referencedProfileIds.add(t.a);
        referencedProfileIds.add(t.b);
      });

      const referencedProfiles = (profiles as any[]).filter((p) => referencedProfileIds.has(p.id));

      const exportObj = {
        exportedAt: new Date().toISOString(),
        session: session ? { email: session.email, role: session.role } : null,
        myProfile,
        myData: {
          shortlist: myShortlist,
          interests: { sent: myInterestsSent, received: myInterestsReceived },
          blocks: myBlocks,
          reports: myReports,
          threads: myThreads,
        },
        referencedProfiles,
        // Note: do not export passwords. Only show user record without password.
        myUserRecord: (users as any[]).find((u) => u.profileId === myProfile.id)
          ? {
              ...(users as any[]).find((u) => u.profileId === myProfile.id),
              password: undefined,
            }
          : null,
      };

      downloadJSON(`holybond-mydata-${myProfile.id}.json`, exportObj);
      showToast("Downloaded ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Download failed");
    } finally {
      setBusy(false);
    }
  }

  const btnPrimary =
    "rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";
  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";
  const btnDanger =
    "rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-200 hover:bg-red-500/15 transition";
  const box =
    "rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8";

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={box}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Settings</div>
            <div className="mt-2 text-sm text-slate-400">
              Manage your account session and local MVP data.
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/member" className={btnGhost}>
              Dashboard
            </Link>
            <Link href="/search" className={btnGhost}>
              Search
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

      {/* Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Logout */}
        <div className={box}>
          <div className="text-white font-semibold">Logout</div>
          <div className="mt-2 text-sm text-slate-400">
            Sign out from this device.
          </div>
          <button className="mt-5 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition" onClick={onLogout}>
            Logout
          </button>
        </div>

        {/* Download */}
        <div className={box}>
          <div className="text-white font-semibold">Download my data</div>
          <div className="mt-2 text-sm text-slate-400">
            Export your profile, shortlist, interests, blocks, and chats as JSON.
          </div>
          <button
            className={`mt-5 w-full ${btnGhost} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onDownloadMyData}
            disabled={busy}
            type="button"
          >
            {busy ? "Please wait..." : "Download JSON"}
          </button>
        </div>

        {/* Reset */}
        <div className={box}>
          <div className="text-white font-semibold">Reset local demo data</div>
          <div className="mt-2 text-sm text-slate-400">
            Clears localStorage keys for HolyBond (profiles, users, interests, chats). This cannot be undone.
          </div>
          <button
            className={`mt-5 w-full ${btnDanger} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onResetAllLocalData}
            disabled={busy}
            type="button"
          >
            {busy ? "Resetting..." : "Reset All Local Data"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-6 text-slate-300">
        <div className="text-sm font-semibold text-white">Note</div>
        <div className="mt-2 text-sm text-slate-400">
          HolyBond MVP uses <span className="text-white">localStorage</span> only. When we add DB later, these settings will change to server-based data.
        </div>
      </div>
    </div>
  );
}
