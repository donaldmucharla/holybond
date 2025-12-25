"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function HomePage() {
  const [lookingFor, setLookingFor] = useState<"" | "Groom" | "Bride">("");
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [denomination, setDenomination] = useState("");
  const [location, setLocation] = useState("");

  const searchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (lookingFor) params.set("lookingFor", lookingFor);
    if (ageFrom.trim()) params.set("ageFrom", ageFrom.trim());
    if (ageTo.trim()) params.set("ageTo", ageTo.trim());
    if (denomination.trim()) params.set("denomination", denomination.trim());
    if (location.trim()) params.set("location", location.trim());
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  }, [lookingFor, ageFrom, ageTo, denomination, location]);

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";
  const selectClass =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400/40";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_25px_80px_rgba(0,0,0,0.55)]">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute -top-40 -left-36 h-[28rem] w-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute -top-24 right-[-80px] h-[22rem] w-[22rem] rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_20%_10%,rgba(255,255,255,0.08),transparent_60%)]" />
        </div>

        <div className="relative p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                Manual verification • Privacy-first • Safer community
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                Find your{" "}
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  God-centered
                </span>{" "}
                match on{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-sky-200 bg-clip-text text-transparent">
                  HolyBond
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-slate-300">
                Profiles & photos are reviewed before they appear. Contact details stay private until both sides agree.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
                >
                  Register Free
                </Link>

                <Link
                  href="/search"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition"
                >
                  Browse Profiles
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm md:grid-cols-3">
                {[
                  ["Manual Review", "Profiles & photos checked"],
                  ["Private Contact", "Details hidden by default"],
                  ["Report & Block", "Safer community rules"],
                ].map(([t, d]) => (
                  <div
                    key={t}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 hover:bg-slate-950/40 transition"
                  >
                    <div className="font-semibold text-white">{t}</div>
                    <div className="mt-1 text-slate-400">{d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Quick Search */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-white">Quick Search</div>
                  <span className="text-xs text-slate-400">Fast • Simple</span>
                </div>

                <div className="mt-5 grid gap-3">
                  <select
                    className={selectClass}
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value as any)}
                  >
                    <option value="">Looking for</option>
                    <option value="Groom">Groom</option>
                    <option value="Bride">Bride</option>
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={inputClass}
                      placeholder="Age from"
                      value={ageFrom}
                      onChange={(e) => setAgeFrom(e.target.value)}
                      inputMode="numeric"
                    />
                    <input
                      className={inputClass}
                      placeholder="Age to"
                      value={ageTo}
                      onChange={(e) => setAgeTo(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <input
                    className={inputClass}
                    placeholder="Denomination (CSI, Pentecostal...)"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                  />

                  <input
                    className={inputClass}
                    placeholder="City / State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />

                  <Link
                    href={searchHref}
                    className="mt-2 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
                  >
                    Search
                  </Link>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                    Tip: Upload a clear photo to get approved faster.
                  </div>

                  <div className="text-xs text-slate-500">
                    Note: Only <span className="text-slate-200">approved</span> profiles appear in search.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      </section>
    </div>
  );
}
