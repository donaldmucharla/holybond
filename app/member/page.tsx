"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getMyProfile,
  myReceivedInterests,
  mySentInterests,
  myShortlistProfiles,
  listMyThreads,
} from "@/lib/auth";
import type { Profile } from "@/types/profile";

function ageFromDob(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
}

const Card = ({ title, value, sub }: { title: string; value: string | number; sub?: string }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
    <div className="text-sm text-slate-400">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    {sub ? <div className="mt-2 text-sm text-slate-400">{sub}</div> : null}
  </div>
);

export default function MemberDashboardPage() {
  const [p, setP] = useState<Profile | null>(null);

  const [shortlistCount, setShortlistCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [threadCount, setThreadCount] = useState(0);

  useEffect(() => {
    const me = getMyProfile();
    setP(me);

    setShortlistCount(myShortlistProfiles().length);
    setSentCount(mySentInterests().length);
    setReceivedCount(myReceivedInterests().length);
    setThreadCount(listMyThreads().length);
  }, []);

  const age = useMemo(() => (p ? ageFromDob(p.dob) : 0), [p]);

  const statusPill =
    p?.status === "APPROVED"
      ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20"
      : p?.status === "REJECTED"
      ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/20"
      : "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/20";

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-2xl font-semibold text-white">
                Welcome{p?.fullName ? `, ${p.fullName}` : ""} 👋
              </div>
              {p?.status ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPill}`}>
                  {p.status}
                </span>
              ) : null}
            </div>

            {p ? (
              <div className="mt-2 text-sm text-slate-400">
                {age} • {p.gender} • {p.city}, {p.state}
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-400">Loading your profile...</div>
            )}

            {p?.status === "PENDING" ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                Your profile is under admin review. You will appear in Search after approval.
              </div>
            ) : null}

            {p?.status === "REJECTED" ? (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                Your profile was rejected. Please update details/photos and submit again.
              </div>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 md:w-[280px]">
            <Link
              href="/search"
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
            >
              Search Profiles
            </Link>
            <Link
              href="/member/profile/edit"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white hover:bg-white/10 transition"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Shortlisted" value={shortlistCount} sub="Profiles you saved" />
        <Card title="Interests Sent" value={sentCount} sub="Pending/accepted/rejected" />
        <Card title="Interests Received" value={receivedCount} sub="Respond in Interests tab" />
        <Card title="Chats" value={threadCount} sub="Your active threads" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Quick Actions</div>
          <div className="mt-4 grid gap-2">
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition" href="/member/profile">
              View My Profile
            </Link>
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition" href="/member/profile/photos">
              Upload Photos
            </Link>
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition" href="/member/interests">
              Manage Interests
            </Link>
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white hover:bg-white/10 transition" href="/member/chat">
              Open Chat
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6">
          <div className="text-sm font-semibold text-white">Safety Reminder</div>
          <div className="mt-2 text-sm text-slate-400">
            Don’t share personal details quickly. Use report/block if someone behaves suspiciously.
          </div>
          <div className="mt-4">
            <Link href="/safety" className="text-sm text-white underline">
              Read Safety Tips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
