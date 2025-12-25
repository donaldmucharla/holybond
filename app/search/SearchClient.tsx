"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Filters from "@/components/Filters";
import ProfileCard from "@/components/ProfileCard";
import type { Profile } from "@/types/profile";
import { getSession, listApprovedProfiles, isBlocked } from "@/lib/auth";

export type SearchFilters = {
  q: string;
  gender: "" | "Male" | "Female";
  denomination: string;
  motherTongue: string;
  country: string;
  state: string;
  city: string;
  education: string;
  profession: string;
  minAge: string;
  maxAge: string;
};

export const emptyFilters: SearchFilters = {
  q: "",
  gender: "",
  denomination: "",
  motherTongue: "",
  country: "",
  state: "",
  city: "",
  education: "",
  profession: "",
  minAge: "",
  maxAge: "",
};

function normalize(s?: string) {
  return (s || "").trim().toLowerCase();
}

function applyInitialFiltersFromQuery(sp: URLSearchParams): SearchFilters {
  return {
    q: sp.get("q") || "",
    gender: (sp.get("gender") as SearchFilters["gender"]) || "",
    denomination: sp.get("denomination") || "",
    motherTongue: sp.get("motherTongue") || "",
    country: sp.get("country") || "",
    state: sp.get("state") || "",
    city: sp.get("city") || "",
    education: sp.get("education") || "",
    profession: sp.get("profession") || "",
    minAge: sp.get("minAge") || "",
    maxAge: sp.get("maxAge") || "",
  };
}

export default function SearchClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() =>
    applyInitialFiltersFromQuery(new URLSearchParams(sp.toString()))
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth gate (localStorage MVP)
  useEffect(() => {
    const s = getSession();
    if (!s) {
      const next = `/search${window.location.search || ""}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [router]);

  // Sync filters with URL changes (back/forward)
  useEffect(() => {
    setFilters(applyInitialFiltersFromQuery(new URLSearchParams(sp.toString())));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  useEffect(() => {
    setLoading(true);
    try {
      const s = getSession();
      const all = listApprovedProfiles();
      const visible = all.filter((p) => {
        if (!s) return false;
        if (s.role !== "ADMIN" && isBlocked(p.id)) return false;
        return true;
      });
      setProfiles(visible);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(filters.q);
    const denom = normalize(filters.denomination);
    const mt = normalize(filters.motherTongue);
    const country = normalize(filters.country);
    const state = normalize(filters.state);
    const city = normalize(filters.city);
    const edu = normalize(filters.education);
    const prof = normalize(filters.profession);

    const minAge = filters.minAge ? parseInt(filters.minAge, 10) : undefined;
    const maxAge = filters.maxAge ? parseInt(filters.maxAge, 10) : undefined;

    return profiles.filter((p) => {
      if (filters.gender && p.gender !== filters.gender) return false;

      if (denom && !normalize(p.denomination).includes(denom)) return false;
      if (mt && !normalize(p.motherTongue).includes(mt)) return false;

      if (country && !normalize(p.country).includes(country)) return false;
      if (state && !normalize(p.state).includes(state)) return false;
      if (city && !normalize(p.city).includes(city)) return false;

      if (edu && !normalize(p.education).includes(edu)) return false;
      if (prof && !normalize(p.profession).includes(prof)) return false;

      if (typeof minAge === "number" || typeof maxAge === "number") {
        const d = new Date(p.dob);
        if (Number.isNaN(d.getTime())) return false;
        const now = new Date();
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        if (typeof minAge === "number" && age < minAge) return false;
        if (typeof maxAge === "number" && age > maxAge) return false;
      }

      if (q) {
        const hay = [
          p.fullName,
          p.city,
          p.state,
          p.country,
          p.education,
          p.profession,
          p.denomination,
          p.motherTongue,
        ]
          .filter(Boolean)
          .join(" ");
        if (!normalize(hay).includes(q)) return false;
      }

      return true;
    });
  }, [filters, profiles]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse approved Christian profiles and filter by location, education, and more.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFilters(emptyFilters)}
          className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Filters
            // @ts-expect-error (keeps compatibility with your existing Filters props)
            value={filters}

            onChange={setFilters}
            onReset={() => setFilters(emptyFilters)}
          />
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Results</div>
            <div className="mt-1 text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{profiles.length}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Loading profiles…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-900">No matches</div>
              <p className="mt-1 text-sm text-slate-600">
                Try clearing filters or searching with fewer keywords.
              </p>
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
