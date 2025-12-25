"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

// ✅ Fixed timestamp (no hydration randomness)
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

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function buildQueryString(sp: SP) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => x != null && usp.append(k, String(x)));
    else if (v != null) usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export default function SearchClient({ searchParams }: { searchParams: SP }) {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => setMounted(true), []);

  // ✅ Login required (Search is private)
  useEffect(() => {
    if (!mounted) return;
    const s = getSession();
    if (!s) {
      const nextUrl = `/search${buildQueryString(searchParams)}`;
      router.replace(`/auth/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    setAuthed(true);
  }, [mounted, router, searchParams]);

  const q = first(searchParams, "q").trim();
  const gender = first(searchParams, "gender");
  const denomination = first(searchParams, "denomination");
  const motherTongue = first(searchParams, "motherTongue");
  const country = first(searchParams, "country").trim();
  const state = first(searchParams, "state").trim();
  const city = first(searchParams, "city").trim();
  const minAge = Number(first(searchParams, "minAge")) || 0;
  const maxAge = Number(first(searchParams, "maxAge")) || 0;
  const sort = first(searchParams, "sort") || "new";

  // ✅ Require at least one filter (don’t show everything by default)
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
    if (!mounted || !authed) return [] as Profile[];
    const approved = listApprovedProfiles();
    return approved.length ? approved : DEMO_PROFILES;
  }, [mounted, authed]);

  const results = useMemo(() => {
    if (!mounted || !authed) return [];
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
  }, [mounted, authed, hasAnyFilter, base, isUser, q, gender, denomination, motherTongue, country, state, city, minAge, maxAge, sort]);

  const usingDemo = mounted && authed && base.length === 3 && base[0]?.id?.startsWith("HB-120");

  if (!mounted || !authed) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        Checking session...
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
