"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types/profile";
import { getMyProfile, getSession, onSessionChange } from "@/lib/auth";

type Session = ReturnType<typeof getSession>;

export function useSession() {
  const [session, setSession] = useState<Session>(() => getSession());
  const [profile, setProfile] = useState<Profile | null>(() => getMyProfile());

  useEffect(() => {
    return onSessionChange((s) => {
      setSession(s);
      setProfile(getMyProfile());
    });
  }, []);

  return { session, profile };
}
