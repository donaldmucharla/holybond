"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/auth";
import type { Profile } from "@/types/profile";

type Draft = Omit<Profile, "id" | "createdAt" | "updatedAt" | "status">;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [draft, setDraft] = useState<Draft>({
    fullName: "",
    gender: "Male",
    dob: "",
    denomination: "",
    motherTongue: "",
    country: "",
    state: "",
    city: "",
    education: "",
    profession: "",
    aboutMe: "",
    partnerPreference: "",
    photos: [],
  });

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((p) => ({ ...p, [k]: v }));
  }

  function validate() {
    if (!email.trim()) return "Email is required";
    if (!password.trim() || password.length < 6) return "Password must be at least 6 characters";
    if (!draft.fullName.trim()) return "Full name is required";
    if (!draft.dob.trim()) return "DOB is required";
    if (!draft.country.trim() || !draft.state.trim() || !draft.city.trim()) return "Country/State/City required";
    if (!draft.education.trim()) return "Education is required";
    if (!draft.profession.trim()) return "Profession is required";
    if (!draft.aboutMe.trim()) return "About me is required";
    if (!draft.partnerPreference.trim()) return "Partner preference is required";
    return "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const v = validate();
    if (v) return setErr(v);

    try {
      setBusy(true);
      registerUser(email.trim(), password, draft);
      router.push("/member");
    } catch (e: any) {
      setErr(e?.message ?? "Register failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-white/10";
  const selectCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/10";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="text-2xl font-semibold text-white">Register</div>
        <div className="mt-2 text-sm text-slate-400">
          After registration, your profile is <span className="text-slate-200">PENDING</span> until admin approves.
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-5">
        {err ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 chars"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Full Name</label>
            <input className={inputCls} value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Gender</label>
              <select className={selectCls} value={draft.gender} onChange={(e) => set("gender", e.target.value as any)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">DOB</label>
              <input className={inputCls} type="date" value={draft.dob} onChange={(e) => set("dob", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Denomination</label>
            <input className={inputCls} value={draft.denomination} onChange={(e) => set("denomination", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Mother Tongue</label>
            <input className={inputCls} value={draft.motherTongue} onChange={(e) => set("motherTongue", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs text-slate-400">Country</label>
            <input className={inputCls} value={draft.country} onChange={(e) => set("country", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">State</label>
            <input className={inputCls} value={draft.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">City</label>
            <input className={inputCls} value={draft.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Education</label>
            <input className={inputCls} value={draft.education} onChange={(e) => set("education", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Profession</label>
            <input className={inputCls} value={draft.profession} onChange={(e) => set("profession", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">About Me</label>
            <textarea className={`${inputCls} min-h-[140px]`} value={draft.aboutMe} onChange={(e) => set("aboutMe", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Partner Preference</label>
            <textarea className={`${inputCls} min-h-[140px]`} value={draft.partnerPreference} onChange={(e) => set("partnerPreference", e.target.value)} />
          </div>
        </div>

        <button
          disabled={busy}
          className={`w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition ${
            busy ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {busy ? "Creating..." : "Create Account"}
        </button>

        <div className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link className="text-white underline" href="/auth/login">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}
