"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/types/profile";
import { getMyProfile, updateMyProfile } from "@/lib/auth";

function isISODate(s: string) {
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function EditProfilePage() {
  const me = useMemo(() => getMyProfile(), []);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) {
      window.location.href = "/auth/login";
      return;
    }

    setForm({
      fullName: me.fullName ?? "",
      gender: me.gender ?? "Male",
      dob: me.dob ?? "",
      denomination: me.denomination ?? "",
      motherTongue: me.motherTongue ?? "",
      country: me.country ?? "",
      state: me.state ?? "",
      city: me.city ?? "",
      education: me.education ?? "",
      profession: me.profession ?? "",
      aboutMe: me.aboutMe ?? "",
      partnerPreference: me.partnerPreference ?? "",
    });
  }, [me]);

  function showToast(msg: string, ms = 1600) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function validate(): string | null {
    const fullName = (form.fullName ?? "").toString().trim();
    const dob = (form.dob ?? "").toString().trim();

    if (!fullName) return "Full name is required";
    if (!dob) return "Date of birth is required";
    if (!isISODate(dob)) return "DOB must be in YYYY-MM-DD format";

    const gender = form.gender;
    if (gender !== "Male" && gender !== "Female") return "Select gender";

    return null;
  }

  function onSave() {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    try {
      setBusy(true);
      setErr("");

      updateMyProfile({
        fullName: (form.fullName ?? "").toString().trim(),
        gender: form.gender as any,
        dob: (form.dob ?? "").toString().trim(),

        denomination: (form.denomination ?? "").toString().trim(),
        motherTongue: (form.motherTongue ?? "").toString().trim(),

        country: (form.country ?? "").toString().trim(),
        state: (form.state ?? "").toString().trim(),
        city: (form.city ?? "").toString().trim(),

        education: (form.education ?? "").toString().trim(),
        profession: (form.profession ?? "").toString().trim(),

        aboutMe: (form.aboutMe ?? "").toString().trim(),
        partnerPreference: (form.partnerPreference ?? "").toString().trim(),
      });

      showToast("Profile saved ✅ (status may become PENDING for re-approval)");
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";
  const labelCls = "text-xs text-slate-400";
  const btnPrimary =
    "rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";
  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  if (!me) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Edit Profile</div>
            <div className="mt-2 text-sm text-slate-400">
              Update your details. If you were approved, saving may move status back to Pending.
            </div>
          </div>

          {/* ✅ FIXED: Real Links */}
          <div className="flex gap-2">
            <Link href="/member/profile" className={btnGhost}>
              My Profile
            </Link>
            <Link href="/member/profile/photos" className={btnGhost}>
              Photos
            </Link>
          </div>
        </div>

        {toast ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
            {toast}
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="text-sm font-semibold text-white">Basic</div>

          <div>
            <div className={labelCls}>Full Name *</div>
            <input
              className={inputCls}
              value={(form.fullName ?? "") as string}
              onChange={(e) => setField("fullName", e.target.value as any)}
              placeholder="Your full name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className={labelCls}>Gender *</div>
              <select
                className={inputCls}
                value={(form.gender ?? "Male") as string}
                onChange={(e) => setField("gender", e.target.value as any)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <div className={labelCls}>Date of Birth *</div>
              {/* ✅ Better UX: type="date" still produces YYYY-MM-DD */}
              <input
                className={inputCls}
                type="date"
                value={(form.dob ?? "") as string}
                onChange={(e) => setField("dob", e.target.value as any)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className={labelCls}>Denomination</div>
              <input
                className={inputCls}
                value={(form.denomination ?? "") as string}
                onChange={(e) => setField("denomination", e.target.value as any)}
                placeholder="CSI / Baptist / Pentecostal..."
              />
            </div>
            <div>
              <div className={labelCls}>Mother Tongue</div>
              <input
                className={inputCls}
                value={(form.motherTongue ?? "") as string}
                onChange={(e) => setField("motherTongue", e.target.value as any)}
                placeholder="Telugu / Tamil / Malayalam..."
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className={labelCls}>Country</div>
              <input
                className={inputCls}
                value={(form.country ?? "") as string}
                onChange={(e) => setField("country", e.target.value as any)}
                placeholder="USA / India"
              />
            </div>
            <div>
              <div className={labelCls}>State</div>
              <input
                className={inputCls}
                value={(form.state ?? "") as string}
                onChange={(e) => setField("state", e.target.value as any)}
                placeholder="MA / TS"
              />
            </div>
            <div>
              <div className={labelCls}>City</div>
              <input
                className={inputCls}
                value={(form.city ?? "") as string}
                onChange={(e) => setField("city", e.target.value as any)}
                placeholder="Boston / Hyderabad"
              />
            </div>
          </div>
        </div>

        {/* Career */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="text-sm font-semibold text-white">Career</div>

          <div>
            <div className={labelCls}>Education</div>
            <input
              className={inputCls}
              value={(form.education ?? "") as string}
              onChange={(e) => setField("education", e.target.value as any)}
              placeholder="Masters / B.Tech / Bachelors..."
            />
          </div>

          <div>
            <div className={labelCls}>Profession</div>
            <input
              className={inputCls}
              value={(form.profession ?? "") as string}
              onChange={(e) => setField("profession", e.target.value as any)}
              placeholder="Software Engineer / Nurse..."
            />
          </div>

          <div>
            <div className={labelCls}>About Me</div>
            <textarea
              className={`${inputCls} min-h-[130px]`}
              value={(form.aboutMe ?? "") as string}
              onChange={(e) => setField("aboutMe", e.target.value as any)}
              placeholder="Write a short bio..."
            />
          </div>

          <div>
            <div className={labelCls}>Partner Preference</div>
            <textarea
              className={`${inputCls} min-h-[130px]`}
              value={(form.partnerPreference ?? "") as string}
              onChange={(e) => setField("partnerPreference", e.target.value as any)}
              placeholder="What kind of partner you are looking for..."
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-400">
          Tip: Add photos in{" "}
          <Link className="text-white underline" href="/member/profile/photos">
            Photos
          </Link>
          .
        </div>

        <div className="flex gap-2">
          <Link href="/member/profile" className={btnGhost}>
            Cancel
          </Link>
          <button
            className={`${btnPrimary} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={onSave}
            disabled={busy}
            type="button"
          >
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
