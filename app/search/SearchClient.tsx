"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Filters from "@/components/Filters";
import ProfileCard from "@/components/ProfileCard";
import type { Profile } from "@/types/profile";
import { listApprovedProfiles, getSession, isBlocked } from "@/lib/auth";

function ageFromDob(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(age, 0);
}

function safeIncludes(a: string, b: string) {
  return a.toLowerCase().includes(b.toLowerCase());
}

// fixed timestamp (no hydration mismatch)
const DEMO_NOW = "2025-01-01T00:00:00.000Z";

const DEMO_PROFILES: Profile[] = [
  {
    id: "HB-1201",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
    status: "APPROVED",
    fullName: "Anjali Reddy",
    gender: "Female",
    dob: "1999-06-15",
    denomination: "CSI",
    motherTongue: "Telugu",
    country: "India",
    state: "Telangana",
    city: "Hyderabad",
    education: "M.Tech",
    profession: "Software Engineer",
    aboutMe: "I value faith, family, and a peaceful lifestyle.",
    partnerPreference: "God-fearing, kind, stable, and family oriented.",
    photos: [],
  },
  {
    id: "HB-1202",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
    status: "APPROVED",
    fullName: "Sam Johnson",
    gender: "Male",
    dob: "1997-02-01",
    denomination: "Pentecostal",
    motherTongue: "English",
    country: "USA",
    state: "Massachusetts",
    city: "Boston",
    education: "MS",
    profession: "DevOps Engineer",
    aboutMe: "Simple person, focused on faith and growth.",
    partnerPreference: "Strong faith, respectful communication, shared goals.",
    photos: [],
  },
  {
    id: "HB-1203",
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
    status: "APPROVED",
    fullName: "Maria Thomas",
    gender: "Female",
    dob: "1996-11-20",
    denomination: "Baptist",
    motherTongue: "Tamil",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    education: "MBA",
    profession: "Business Analyst",
    aboutMe: "I enjoy church activities and helping people.",
    partnerPreference: "Christ-centered, honest, supportive.",
    photos: [],
  },
];

export default function SearchClient() {
  const sp = useSearchParams();

  // mount guard (avoid server/client mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const q = (sp.get("q") ?? "").trim();
  const gender = sp.get("gender") ?? "";
  const denomination = sp.get("denomination") ?? "";
  const motherTongue = sp.get("motherTongue") ?? "";
  const country = (sp.get("country") ?? "").trim();
  const state = (sp.get("state") ?? "").trim();
  const city = (sp.get("city") ?? "").trim();
  const minAge = Number(sp.get("minAge") ?? "") || 0;
  const maxAge = Number(sp.get("maxAge") ?? "") || 0;
  const sort = sp.get("sort") ?? "new";

  // at least one filter must be applied
  const hasAnyFilter = useMemo(() => {
    const g = gender && gender !== "Any";
    const d = denomination && denomination !== "Any";
    const m = motherTongue && motherTongue !== "Any";
    const a = minAge > 0 || maxAge > 0;
    const loc = !!country || !!state || !!city;
    return !!q || g || d || m || loc || a;
  }, [q, gender, denomination, motherTongue, country, state, city, minAge, maxAge]);

  const session = useMemo(() => (mounted ? getSession() : null), [mounted]);
  const isUser = session?.role === "USER";

  const base = useMemo(() => {
    if (!mounted) return [] as Profile[];
    const approved = listApprovedProfiles();
    return approved.length ? approved : DEMO_PROFILES;
  }, [mounted]);

  const results = useMemo(() => {
    if (!mounted) return [];
    if (!hasAnyFilter) return [];

    let items = [...base];

    if (isUser) {
      items = items.filter((p) => {
        try {
          return !isBlocked(p.id);
        } catch {
          return true;
        }
      });
    }

    if (q) {
      items = items.filter((p) => {
        const hay = `${p.fullName} ${p.city} ${p.state} ${p.country} ${p.education} ${p.profession} ${p.denomination} ${p.motherTongue}`;
        return safeIncludes(hay, q);
      });
    }

    if (gender && gender !== "Any") items = items.filter((p) => p.gender === gender);
    if (denomination && denomination !== "Any") items = items.filter((p) => p.denomination === denomination);
    if (motherTongue && motherTongue !== "Any") items = items.filter((p) => p.motherTongue === motherTongue);

    if (country) items = items.filter((p) => safeIncludes(p.country, country));
    if (state) items = items.filter((p) => safeIncludes(p.state, state));
    if (city) items = items.filter((p) => safeIncludes(p.city, city));

    if (minAge > 0) items = items.filter((p) => ageFromDob(p.dob) >= minAge);
    if (maxAge > 0) items = items.filter((p) => ageFromDob(p.dob) <= maxAge);

    if (sort === "age_asc") items.sort((a, b) => ageFromDob(a.dob) - ageFromDob(b.dob));
    else if (sort === "age_desc") items.sort((a, b) => ageFromDob(b.dob) - ageFromDob(a.dob));
    else items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return items;
  }, [mounted, base, hasAnyFilter, q, gender, denomination, motherTongue, country, state, city, minAge, maxAge, sort, isUser]);

  const usingDemo = mounted && base.length === 3 && base[0]?.id?.startsWith("HB-120");

  if (!mounted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="text-2xl font-semibold text-white">Search Profiles</div>
        <div className="mt-2 text-sm text-slate-400">
          Use filters to find the right match. Profiles appear here after admin approval.
        </div>

        {usingDemo ? (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
            Demo profiles are available for testing. Results will show only after you apply at least one filter.
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Filters />
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-300">
              Results: <span className="text-white font-semibold">{results.length}</span>
            </div>
            <div className="text-xs text-slate-500">
              {hasAnyFilter ? "Tip: click “View” for full profile" : "Add filters and click Apply"}
            </div>
          </div>

          {!hasAnyFilter ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-white font-semibold">No results yet</div>
              <div className="mt-2 text-sm text-slate-400">
                Choose at least one filter and click <span className="text-white font-semibold">Apply</span>.
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="text-white font-semibold">No profiles found</div>
              <div className="mt-2 text-sm text-slate-400">Try changing age/location/denomination.</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
