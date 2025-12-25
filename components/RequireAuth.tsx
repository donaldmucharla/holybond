"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();

    if (!s) {
      // keep current page + query
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/search";

      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
