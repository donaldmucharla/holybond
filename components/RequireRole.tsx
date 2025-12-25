"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";

type Role = "USER" | "ADMIN";

export default function RequireRole({
  allow,
  redirectTo,
  children,
}: {
  allow: Role;
  redirectTo: string;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      window.location.href = redirectTo;
      return;
    }
    if (s.role !== allow) {
      // if user lands in wrong area, send them to correct dashboard
      window.location.href = s.role === "ADMIN" ? "/admin" : "/member";
      return;
    }
    setOk(true);
  }, [allow, redirectTo]);

  if (!ok) return null;
  return <>{children}</>;
}
