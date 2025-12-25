"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getMyProfile, getProfileById, listMyThreads } from "@/lib/auth";

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ChatListPage() {
  const me = useMemo(() => getMyProfile(), []);
  const [q, setQ] = useState("");

  const threads = useMemo(() => {
    const list = listMyThreads();
    // sort by last message time
    return [...list].sort((a, b) => {
      const at = a.messages?.[a.messages.length - 1]?.createdAt ?? a.createdAt ?? "";
      const bt = b.messages?.[b.messages.length - 1]?.createdAt ?? b.createdAt ?? "";
      return bt.localeCompare(at);
    });
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return threads;

    return threads.filter((t) => {
      const otherId = me?.id ? (t.a === me.id ? t.b : t.a) : t.a;
      const other = getProfileById(otherId);
      const last = t.messages?.[t.messages.length - 1]?.text ?? "";

      const hay = [
        t.id,
        otherId,
        other?.fullName ?? "",
        other?.city ?? "",
        other?.state ?? "",
        other?.country ?? "",
        last,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [q, threads, me?.id]);

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";

  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">Chat</div>
            <div className="mt-2 text-sm text-slate-400">
              Your conversations (demo chat stored in localStorage).
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/search" className={btnGhost}>
              Search
            </Link>
            <Link href="/member/interests" className={btnGhost}>
              Interests
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <input
            className={inputCls}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats by name, location, or last message..."
          />
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-slate-300">
          No chat threads yet.
          <div className="mt-2 text-sm text-slate-400">
            Open a profile and click <span className="text-white">Start Chat</span>.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const otherId = me?.id ? (t.a === me.id ? t.b : t.a) : t.a;
            const other = getProfileById(otherId);
            const img = other?.photos?.[0] ?? "";
            const lastMsg = t.messages?.[t.messages.length - 1];
            const lastText = lastMsg?.text ?? "No messages yet";
            const lastTime = lastMsg?.createdAt ?? t.createdAt;
            const loc = [other?.city, other?.state, other?.country].filter(Boolean).join(", ");

            return (
              <Link
                key={t.id}
                href={`/member/chat/${t.id}`}
                className="block rounded-[28px] border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={other?.fullName ?? "User"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-white font-semibold">
                          {other?.fullName ?? "Conversation"}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {loc || otherId}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-500">{lastTime ? fmtTime(lastTime) : ""}</div>
                        <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-slate-950/30 px-3 py-1 text-xs text-slate-200">
                          {t.messages?.length ?? 0} msgs
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-slate-300 truncate">
                      {lastText}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
