"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession, getMyProfile, updateMyProfile } from "@/lib/auth";
import type { Profile } from "@/types/profile";

const MAX_PHOTOS = 5;

// Compression settings (saves space in localStorage)
const MAX_W = 1000;
const MAX_H = 1000;
const JPEG_QUALITY = 0.75;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  // read file into image
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Failed to read file"));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Invalid image"));
    i.src = dataUrl;
  });

  // compute resized dimensions
  let w = img.width;
  let h = img.height;
  const scale = Math.min(MAX_W / w, MAX_H / h, 1);
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  // draw to canvas
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, w, h);

  // export as compressed jpeg (much smaller than png base64)
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function MemberProfilePhotosPage() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push("/auth/login");
      return;
    }
    setProfile(getMyProfile());
  }, [router]);

  function openPicker() {
    setMsg("");
    inputRef.current?.click();
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setMsg("");
      const files = e.target.files ? Array.from(e.target.files) : [];
      e.target.value = "";

      if (!profile) return;
      if (files.length === 0) return;

      const current = profile.photos?.length || 0;
      const remaining = Math.max(0, MAX_PHOTOS - current);
      if (remaining === 0) {
        setMsg(`You can upload max ${MAX_PHOTOS} photos.`);
        return;
      }

      const selected = files.slice(0, remaining);

      setSaving(true);

      // ✅ compress each image before saving
      const compressed = await Promise.all(selected.map(fileToCompressedDataUrl));
      const nextPhotos = [...(profile.photos || []), ...compressed];

      // ✅ use return value (persisted profile)
      const updated = updateMyProfile({ photos: nextPhotos });
      setProfile(updated);

      setMsg("Photos saved ✅");
    } catch (err: any) {
      setMsg(err?.message || "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  function removePhoto(idx: number) {
    if (!profile) return;
    try {
      setSaving(true);
      const nextPhotos = (profile.photos || []).filter((_, i) => i !== idx);
      const updated = updateMyProfile({ photos: nextPhotos });
      setProfile(updated);
      setMsg("Photo removed ✅");
    } catch (err: any) {
      setMsg(err?.message || "Remove failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  const count = profile.photos?.length || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Photos</div>
            <div className="mt-2 text-sm text-slate-400">
              Upload up to {MAX_PHOTOS} photos. Images are compressed before saving.
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Uploaded: {count}/{MAX_PHOTOS}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition"
              onClick={openPicker}
              disabled={saving}
            >
              {saving ? "Saving..." : "Upload photos"}
            </button>

            <button
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition"
              onClick={() => router.push("/member/profile")}
            >
              Back
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            {msg}
          </div>
        ) : null}
      </div>

      {count === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          No photos yet. Click <span className="text-white font-semibold">Upload photos</span>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(profile.photos || []).map((src, idx) => (
            <div key={idx} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${idx + 1}`} className="h-52 w-full object-contain bg-black/20" />
              <div className="flex items-center justify-between p-4">
                <div className="text-xs text-slate-400">Photo {idx + 1}</div>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10 transition"
                  onClick={() => removePhoto(idx)}
                  disabled={saving}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
