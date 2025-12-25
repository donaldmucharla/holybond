"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [ok, setOk] = useState(false);

  const nextUrl = useMemo(() => {
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, sp]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace(`/auth/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    setOk(true);
  }, [router, nextUrl]);

  if (!ok) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
