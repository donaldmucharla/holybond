"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function setParam(params: URLSearchParams, key: string, value: string) {
  const v = value.trim();
  if (!v) params.delete(key);
  else params.set(key, v);
}

const denominations = ["Any", "CSI", "CNI", "Pentecostal", "Baptist", "Methodist", "Catholic", "Independent"];
const motherTongues = ["Any", "Telugu", "Tamil", "Malayalam", "Kannada", "Hindi", "English", "Other"];
const genders = ["Any", "Male", "Female"];
const sortOptions = [
  { label: "Newest", value: "new" },
  { label: "Age: Low to High", value: "age_asc" },
  { label: "Age: High to Low", value: "age_desc" },
];

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initial = useMemo(() => {
    return {
      q: sp.get("q") ?? "",
      gender: sp.get("gender") ?? "Any",
      denomination: sp.get("denomination") ?? "Any",
      motherTongue: sp.get("motherTongue") ?? "Any",
      country: sp.get("country") ?? "",
      state: sp.get("state") ?? "",
      city: sp.get("city") ?? "",
      minAge: sp.get("minAge") ?? "",
      maxAge: sp.get("maxAge") ?? "",
      sort: sp.get("sort") ?? "new",
    };
  }, [sp]);

  const [q, setQ] = useState(initial.q);
  const [gender, setGender] = useState(initial.gender);
  const [denomination, setDenomination] = useState(initial.denomination);
  const [motherTongue, setMotherTongue] = useState(initial.motherTongue);
  const [country, setCountry] = useState(initial.country);
  const [state, setState] = useState(initial.state);
  const [city, setCity] = useState(initial.city);
  const [minAge, setMinAge] = useState(initial.minAge);
  const [maxAge, setMaxAge] = useState(initial.maxAge);
  const [sort, setSort] = useState(initial.sort);

  function apply() {
    const params = new URLSearchParams(sp.toString());

    setParam(params, "q", q);

    if (gender === "Any") params.delete("gender");
    else setParam(params, "gender", gender);

    if (denomination === "Any") params.delete("denomination");
    else setParam(params, "denomination", denomination);

    if (motherTongue === "Any") params.delete("motherTongue");
    else setParam(params, "motherTongue", motherTongue);

    setParam(params, "country", country);
    setParam(params, "state", state);
    setParam(params, "city", city);

    setParam(params, "minAge", minAge);
    setParam(params, "maxAge", maxAge);

    setParam(params, "sort", sort);

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10";
  const selectCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/10";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Filters</div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400">Keyword</label>
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, city, profession..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Gender</label>
            <select className={selectCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Denomination</label>
            <select className={selectCls} value={denomination} onChange={(e) => setDenomination(e.target.value)}>
              {denominations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Mother Tongue</label>
          <select className={selectCls} value={motherTongue} onChange={(e) => setMotherTongue(e.target.value)}>
            {motherTongues.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400">Country</label>
            <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
          </div>
          <div>
            <label className="text-xs text-slate-400">State</label>
            <input className={inputCls} value={state} onChange={(e) => setState(e.target.value)} placeholder="Telangana" />
          </div>
          <div>
            <label className="text-xs text-slate-400">City</label>
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Hyderabad" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Min Age</label>
            <input
              className={inputCls}
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              placeholder="e.g. 22"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Max Age</label>
            <input
              className={inputCls}
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              placeholder="e.g. 32"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400">Sort</label>
          <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value)}>
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
