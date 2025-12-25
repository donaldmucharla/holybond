"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminGetUserWithProfile } from "@/lib/auth";

export default function AdminUserViewPage() {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      setErr("");
      setData(adminGetUserWithProfile(userId));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load user");
      setData(null);
    }
  }, [userId]);

  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  if (err) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="text-white font-semibold">User</div>
        <div className="mt-2 text-sm text-red-200">{err}</div>
        <div className="mt-4">
          <Link href="/admin/users" className={btnGhost}>
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, profile } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-white">User Details</div>
            <div className="mt-2 text-sm text-slate-400">
              User ID: <span className="text-slate-200">{user.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className={btnGhost}>
              Back
            </Link>
            <Link href={`/u/${user.profileId}`} className={btnGhost}>
              View Profile
            </Link>
            <Link href={`/admin/users/${user.id}/edit`} className={btnGhost}>
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="text-xs text-slate-500">Email</div>
            <div className="mt-1 text-white">{user.email}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="text-xs text-slate-500">Role</div>
            <div className="mt-1 text-white">{user.role}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="text-xs text-slate-500">Profile ID</div>
            <div className="mt-1 text-white">{user.profileId}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="text-xs text-slate-500">Profile Status</div>
            <div className="mt-1 text-white">{profile?.status ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="text-white font-semibold">Profile Summary</div>
        <div className="mt-3 text-sm text-slate-300">
          <div>Name: <span className="text-white">{profile?.fullName ?? "—"}</span></div>
          <div>Gender: <span className="text-white">{profile?.gender ?? "—"}</span></div>
          <div>DOB: <span className="text-white">{profile?.dob ?? "—"}</span></div>
          <div>Location: <span className="text-white">{[profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || "—"}</span></div>
          <div>Profession: <span className="text-white">{profile?.profession ?? "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
