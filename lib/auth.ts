"use client";

import { STORAGE_KEYS, HB_ID_PREFIX } from "@/lib/constants";
import type { Profile } from "@/types/profile";
import type { Interest } from "@/types/interest";

export type Role = "USER" | "ADMIN";

export type Account = {
  id: string;
  email: string;
  password: string; // demo only
  role: Role;
  profileId: string;
  createdAt: string;
};

type Session = { userId: string; email: string; role: Role };
function emitSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("hb:session"));
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(prefix = "") {
  return prefix + Math.random().toString(16).slice(2, 10).toUpperCase();
}

function genHBProfileId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${HB_ID_PREFIX}${n}`;
}

// -------------------- Session/Auth --------------------
export function seedAdminIfMissing() {
  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);

  const exists = users.some((u) => u.email === "admin@holybond.in");
  if (exists) return;

  const profileId = genId("P-");
  const now = new Date().toISOString();

  profiles.push({
    id: profileId,
    createdAt: now,
    updatedAt: now,
    status: "APPROVED",
    fullName: "HolyBond Admin",
    gender: "Male",
    dob: "1990-01-01",
    denomination: "NA",
    motherTongue: "NA",
    country: "India",
    state: "NA",
    city: "NA",
    education: "NA",
    profession: "NA",
    aboutMe: "Admin account",
    partnerPreference: "NA",
    photos: [],
  });

  users.push({
    id: genId("U-"),
    email: "admin@holybond.in",
    password: "Admin@123",
    role: "ADMIN",
    profileId,
    createdAt: now,
  });

  writeJSON(STORAGE_KEYS.USERS, users);
  writeJSON(STORAGE_KEYS.PROFILES, profiles);
}

export function getSession(): Session | null {
  return readJSON<Session | null>(STORAGE_KEYS.SESSION, null);
}
export function onSessionChange(cb: (session: Session | null) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => cb(getSession());

  window.addEventListener("hb:session", handler);

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.SESSION) handler();
  };
  window.addEventListener("storage", storageHandler);

  handler();

  return () => {
    window.removeEventListener("hb:session", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  emitSessionChanged();
}

export function clearSession() {
  logout();
}

export function login(email: string, password: string) {
  seedAdminIfMissing();

  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) throw new Error("User not found");
  if (user.password !== password) throw new Error("Invalid password");

  const session: Session = { userId: user.id, email: user.email, role: user.role };
  writeJSON(STORAGE_KEYS.SESSION, session);

  emitSessionChanged();
  return session;
}



export function registerUser(
  email: string,
  password: string,
  profileDraft: Omit<Profile, "id" | "createdAt" | "updatedAt" | "status">
) {
  seedAdminIfMissing();

  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);

  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error("Email already exists");

  const now = new Date().toISOString();
  const profileId = genHBProfileId();

  const profile: Profile = {
    id: profileId,
    createdAt: now,
    updatedAt: now,
    status: "PENDING",
    ...profileDraft,
  };

  const user: Account = {
    id: genId("U-"),
    email,
    password,
    role: "USER",
    profileId: profile.id,
    createdAt: now,
  };

  profiles.push(profile);
  users.push(user);

  writeJSON(STORAGE_KEYS.PROFILES, profiles);
  writeJSON(STORAGE_KEYS.USERS, users);

  const session: Session = { userId: user.id, email: user.email, role: user.role };
  writeJSON(STORAGE_KEYS.SESSION, session);

  emitSessionChanged();
  return { user, profile, session };
}

// -------------------- Profile --------------------
export function getMyProfile(): Profile | null {
  const session = getSession();
  if (!session) return null;

  // ✅ IMPORTANT: Admin should NOT participate in matchmaking.
  if (session.role !== "USER") return null;

  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);

  const me = users.find((u) => u.id === session.userId);
  if (!me) return null;

  return profiles.find((p) => p.id === me.profileId) ?? null;
}

export function updateMyProfile(patch: Partial<Profile>) {
  const session = getSession();
  if (!session) throw new Error("Not logged in");
  if (session.role !== "USER") throw new Error("Admin cannot update profile");

  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const me = users.find((u) => u.id === session.userId);
  if (!me) throw new Error("User missing");

  const idx = profiles.findIndex((p) => p.id === me.profileId);
  if (idx === -1) throw new Error("Profile missing");

  const existing = profiles[idx];

  // ✅ treat as "photos only" if there are no meaningful changes except photos
  const IGNORE_KEYS = new Set(["id", "createdAt", "updatedAt", "status", "photos"]);
  const patchKeys = Object.keys(patch ?? {});

  const hasMeaningfulNonPhotoChange = patchKeys.some((k) => {
    if (IGNORE_KEYS.has(k)) return false;

    const nextVal = (patch as any)[k];
    if (typeof nextVal === "undefined") return false;

    const prevVal = (existing as any)[k];

    // compare primitives/strings
    return JSON.stringify(nextVal) !== JSON.stringify(prevVal);
  });

  const isPhotosOnlyUpdate =
    patchKeys.includes("photos") && hasMeaningfulNonPhotoChange === false;

  const updated: Profile = {
    ...existing,
    ...patch,

    // ✅ IMPORTANT: never lose photos
    photos: patch.photos ?? existing.photos ?? [],

    updatedAt: new Date().toISOString(),

    // ✅ Keep APPROVED if this update is only photos
    status:
      existing.status === "APPROVED" && !isPhotosOnlyUpdate
        ? "PENDING"
        : existing.status,
  };

  profiles[idx] = updated;

  try {
    writeJSON(STORAGE_KEYS.PROFILES, profiles);
  } catch (e: any) {
    throw new Error("Storage limit exceeded. Upload smaller photos (or fewer).");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("hb:profiles"));
  }

  return updated;
}


// -------------------- Admin Approvals --------------------
export function listPendingProfiles(): Profile[] {
  const session = getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Admin only");

  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  return profiles.filter((p) => p.status === "PENDING");
}

export function adminSetProfileStatus(profileId: string, status: "APPROVED" | "REJECTED") {
  const session = getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Admin only");

  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) throw new Error("Profile not found");

  profiles[idx] = { ...profiles[idx], status, updatedAt: new Date().toISOString() };
  writeJSON(STORAGE_KEYS.PROFILES, profiles);
  return profiles[idx];
}

// -------------------- Public Search --------------------
export function listApprovedProfiles(): Profile[] {
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  return profiles.filter((p) => p.status === "APPROVED");
}

export function getProfileById(profileId: string): Profile | null {
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  return profiles.find((p) => p.id === profileId) ?? null;
}

// -------------------- Shortlist --------------------
type ShortlistItem = {
  ownerProfileId: string;
  savedProfileId: string;
  createdAt: string;
};

export function isShortlisted(savedProfileId: string) {
  const s = getSession();
  if (!s || s.role !== "USER") return false;

  const me = getMyProfile();
  if (!me) return false;

  const list = readJSON<ShortlistItem[]>(STORAGE_KEYS.SHORTLISTS, []);
  return list.some((x) => x.ownerProfileId === me.id && x.savedProfileId === savedProfileId);
}

export function addToShortlist(savedProfileId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot shortlist");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const list = readJSON<ShortlistItem[]>(STORAGE_KEYS.SHORTLISTS, []);
  const exists = list.some((x) => x.ownerProfileId === me.id && x.savedProfileId === savedProfileId);

  if (!exists) {
    list.push({ ownerProfileId: me.id, savedProfileId, createdAt: new Date().toISOString() });
    writeJSON(STORAGE_KEYS.SHORTLISTS, list);
  }
  return list;
}

export function removeFromShortlist(savedProfileId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot shortlist");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const list = readJSON<ShortlistItem[]>(STORAGE_KEYS.SHORTLISTS, []);
  const next = list.filter((x) => !(x.ownerProfileId === me.id && x.savedProfileId === savedProfileId));
  writeJSON(STORAGE_KEYS.SHORTLISTS, next);
  return next;
}

export function myShortlistProfiles(): Profile[] {
  const s = getSession();
  if (!s || s.role !== "USER") return [];

  const me = getMyProfile();
  if (!me) return [];

  const list = readJSON<ShortlistItem[]>(STORAGE_KEYS.SHORTLISTS, []);
  const ids = new Set(list.filter((x) => x.ownerProfileId === me.id).map((x) => x.savedProfileId));

  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  return profiles.filter((p) => ids.has(p.id));
}

// -------------------- Interests --------------------
export function sendInterest(toProfileId: string, message?: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot send interests");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const interests = readJSON<Interest[]>(STORAGE_KEYS.INTERESTS, []);
  const already = interests.some(
    (i) => i.fromProfileId === me.id && i.toProfileId === toProfileId && i.status === "SENT"
  );
  if (already) return interests;

  interests.push({
    id: genId("I-"),
    fromProfileId: me.id,
    toProfileId,
    message,
    status: "SENT",
    createdAt: new Date().toISOString(),
  });

  writeJSON(STORAGE_KEYS.INTERESTS, interests);
  return interests;
}

export function mySentInterests(): Interest[] {
  const s = getSession();
  if (!s || s.role !== "USER") return [];

  const me = getMyProfile();
  if (!me) return [];

  const interests = readJSON<Interest[]>(STORAGE_KEYS.INTERESTS, []);
  return interests.filter((i) => i.fromProfileId === me.id);
}

export function myReceivedInterests(): Interest[] {
  const s = getSession();
  if (!s || s.role !== "USER") return [];

  const me = getMyProfile();
  if (!me) return [];

  const interests = readJSON<Interest[]>(STORAGE_KEYS.INTERESTS, []);
  return interests.filter((i) => i.toProfileId === me.id);
}

export function setInterestStatus(interestId: string, status: "ACCEPTED" | "REJECTED") {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot manage interests");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const interests = readJSON<Interest[]>(STORAGE_KEYS.INTERESTS, []);
  const idx = interests.findIndex((i) => i.id === interestId);
  if (idx === -1) throw new Error("Interest not found");

  if (interests[idx].toProfileId !== me.id) throw new Error("Not allowed");

  interests[idx] = { ...interests[idx], status };
  writeJSON(STORAGE_KEYS.INTERESTS, interests);
  return interests[idx];
}

// -------------------- Block & Reports --------------------
type Block = { ownerProfileId: string; blockedProfileId: string; createdAt: string };

type Report = {
  id: string;
  reporterProfileId: string;
  reportedProfileId: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export function blockProfile(profileId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot block");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const blocks = readJSON<Block[]>(STORAGE_KEYS.BLOCKS, []);
  const exists = blocks.some((b) => b.ownerProfileId === me.id && b.blockedProfileId === profileId);
  if (!exists) {
    blocks.push({
      ownerProfileId: me.id,
      blockedProfileId: profileId,
      createdAt: new Date().toISOString(),
    });
    writeJSON(STORAGE_KEYS.BLOCKS, blocks);
  }
  return blocks;
}

export function unblockProfile(profileId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot unblock");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const blocks = readJSON<Block[]>(STORAGE_KEYS.BLOCKS, []);
  const next = blocks.filter((b) => !(b.ownerProfileId === me.id && b.blockedProfileId === profileId));
  writeJSON(STORAGE_KEYS.BLOCKS, next);
  return next;
}

export function isBlocked(profileId: string) {
  const s = getSession();
  if (!s || s.role !== "USER") return false;

  const me = getMyProfile();
  if (!me) return false;

  const blocks = readJSON<Block[]>(STORAGE_KEYS.BLOCKS, []);
  return blocks.some((b) => b.ownerProfileId === me.id && b.blockedProfileId === profileId);
}

export function reportProfile(profileId: string, reason: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot report");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const reports = readJSON<Report[]>(STORAGE_KEYS.REPORTS, []);
  reports.push({
    id: genId("R-"),
    reporterProfileId: me.id,
    reportedProfileId: profileId,
    reason,
    createdAt: new Date().toISOString(),
  });

  writeJSON(STORAGE_KEYS.REPORTS, reports);
  return reports;
}

export function listReports(): Report[] {
  const session = getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Admin only");
  return readJSON<Report[]>(STORAGE_KEYS.REPORTS, []);
}

export function adminMarkReportReviewed(reportId: string) {
  const session = getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Admin only");

  const reports = readJSON<Report[]>(STORAGE_KEYS.REPORTS, []);
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) throw new Error("Report not found");

  reports[idx] = {
    ...reports[idx],
    reviewedAt: new Date().toISOString(),
    reviewedBy: session.email,
  };

  writeJSON(STORAGE_KEYS.REPORTS, reports);
  return reports[idx];
}



// -------------------- Chat (demo) --------------------
export type ChatMessage = { id: string; from: string; text: string; createdAt: string };
export type ChatThread = { id: string; a: string; b: string; createdAt: string; messages: ChatMessage[] };

export function getOrCreateThread(otherProfileId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot chat");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const threads = readJSON<ChatThread[]>(STORAGE_KEYS.CHAT_THREADS, []);
  const existing =
    threads.find((t) => (t.a === me.id && t.b === otherProfileId) || (t.a === otherProfileId && t.b === me.id)) ?? null;

  if (existing) return existing;

  const th: ChatThread = {
    id: genId("T-"),
    a: me.id,
    b: otherProfileId,
    createdAt: new Date().toISOString(),
    messages: [],
  };

  threads.push(th);
  writeJSON(STORAGE_KEYS.CHAT_THREADS, threads);
  return th;
}

export function listMyThreads() {
  const s = getSession();
  if (!s || s.role !== "USER") return [];

  const me = getMyProfile();
  if (!me) return [];

  const threads = readJSON<ChatThread[]>(STORAGE_KEYS.CHAT_THREADS, []);
  return threads.filter((t) => t.a === me.id || t.b === me.id);
}

export function getThread(threadId: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot chat");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const threads = readJSON<ChatThread[]>(STORAGE_KEYS.CHAT_THREADS, []);
  const th = threads.find((t) => t.id === threadId);
  if (!th) throw new Error("Thread not found");
  if (th.a !== me.id && th.b !== me.id) throw new Error("Not allowed");
  return th;
}

export function sendChatMessage(threadId: string, text: string) {
  const s = getSession();
  if (!s) throw new Error("Login required");
  if (s.role !== "USER") throw new Error("Admin cannot chat");

  const me = getMyProfile();
  if (!me) throw new Error("Login required");

  const threads = readJSON<ChatThread[]>(STORAGE_KEYS.CHAT_THREADS, []);
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx === -1) throw new Error("Thread not found");

  threads[idx].messages.push({
    id: genId("M-"),
    from: me.id,
    text,
    createdAt: new Date().toISOString(),
  });

  writeJSON(STORAGE_KEYS.CHAT_THREADS, threads);
  return threads[idx];
}
// -------------------- Admin: Users & Profiles list (MVP) --------------------
export function listUsersAdmin() {
  const s = getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Admin only");

  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  // return without password for UI safety
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    profileId: u.profileId,
    createdAt: u.createdAt,
  }));
}

export function listProfilesAdmin(): Profile[] {
  const s = getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Admin only");

  return readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
}


// -------------------- Admin: Get user + update profile (MVP) --------------------
export function adminGetUserWithProfile(userId: string) {
  const s = getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Admin only");

  const users = readJSON<Account[]>(STORAGE_KEYS.USERS, []);
  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);

  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("User not found");

  const profile = profiles.find((p) => p.id === user.profileId) ?? null;
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: user.profileId,
      createdAt: user.createdAt,
    },
    profile,
  };
}

export function adminUpdateProfile(profileId: string, patch: Partial<Profile>) {
  const s = getSession();
  if (!s || s.role !== "ADMIN") throw new Error("Admin only");

  const profiles = readJSON<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) throw new Error("Profile not found");

  profiles[idx] = {
    ...profiles[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(STORAGE_KEYS.PROFILES, profiles);
  return profiles[idx];
}


