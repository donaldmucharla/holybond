"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMyProfile } from "@/lib/auth";
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

export default function MemberProfilePage() {
  const [p, setP] = useState<Profile | null>(null);

  useEffect(() => {
    setP(getMyProfile());
  }, []);

  const age = useMemo(() => (p ? ageFromDob(p.dob) : 0), [p]);

  if (!p) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        Loading your profile...
      </div>
    );
  }

  const badge =
    p.status === "APPROVED"
      ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20"
      : p.status === "REJECTED"
      ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/20"
      : "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/20";

  const banner =
    p.status === "APPROVED"
      ? null
      : p.status === "PENDING"
      ? "Your profile is under review. It will appear in Search after admin approval."
      : "Your profile was rejected. Please update details/photos and submit again.";

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-2xl font-semibold text-white">{p.fullName}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{p.status}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">
                {p.id}
              </span>
            </div>

            <div className="mt-2 text-sm text-slate-400">
              {age} • {p.gender} • {p.denomination} • {p.motherTongue}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              {p.city}, {p.state}, {p.country}
            </div>

            {banner ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-200">
                {banner}
              </div>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-2 md:w-[280px]">
            <Link
              href="/member/profile/edit"
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
            >
              Edit Profile
            </Link>
            <Link
              href="/member/profile/photos"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white hover:bg-white/10 transition"
            >
              Manage Photos
            </Link>
            <Link
              href={`/u/${p.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white hover:bg-white/10 transition"
            >
              View Public Profile
            </Link>
          </div>
        </div>
      </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Photos</div>
          <Link
            href="/member/profile/photos"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition"
          >
            Manage
          </Link>
        </div>

        {p.photos?.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {p.photos.slice(0, 6).map((src, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`photo-${idx + 1}`}
                  className="w-full aspect-[4/3] object-contain bg-black/20"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No photos uploaded yet. Add photos in{" "}
            <Link className="text-white underline" href="/member/profile/photos">
              Manage Photos
            </Link>
            .
          </div>
        )}
      </div>


      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">About</div>
          <div className="mt-3 whitespace-pre-line text-sm text-slate-300">{p.aboutMe}</div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Preferred Partner</div>
          <div className="mt-3 whitespace-pre-line text-sm text-slate-300">{p.partnerPreference}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Education</div>
          <div className="mt-2 text-sm text-slate-200">{p.education}</div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-white">Profession</div>
          <div className="mt-2 text-sm text-slate-200">{p.profession}</div>
        </div>
      </div>
    </div>
  );
}
