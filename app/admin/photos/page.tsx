"use client";

import { useEffect, useState } from "react";
import { listProfilesAdmin } from "@/lib/auth";
import type { Profile } from "@/types/profile";

export default function AdminPhotosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      setProfiles(listProfilesAdmin());
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profiles");
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="text-2xl font-semibold text-white">Photo Review</div>
        <div className="mt-2 text-sm text-slate-400">
          MVP view: see uploaded photos. Use Approvals to approve/reject profile.
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{err}</div>
      ) : null}

      {profiles.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">No profiles found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-white font-semibold truncate">{p.fullName}</div>
              <div className="mt-1 text-xs text-slate-400">{p.id} • {p.status}</div>

              <div className="mt-3">
                {p.photos?.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {p.photos.slice(0, 6).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt="photo"
                        className="h-20 w-full rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No photos.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
