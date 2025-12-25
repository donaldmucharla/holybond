"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function MemberDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const s = getSession();

    if (!s) {
      router.replace(`/auth/login?next=${encodeURIComponent("/member/dashboard")}`);
      return;
    }

    // Admin should not be on member pages
    if (s.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    // Your member landing exists at /member
    router.replace("/member");
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">Loading dashboard…</div>
      </div>
    </div>
  );
}
