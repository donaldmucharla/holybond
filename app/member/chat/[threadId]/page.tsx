"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Profile } from "@/types/profile";
import type { ChatThread } from "@/lib/auth";
import { getMyProfile, getProfileById, getThread, sendChatMessage } from "@/lib/auth";

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const me = useMemo(() => getMyProfile(), []);

  const [thread, setThread] = useState<ChatThread | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      setErr("");
      const th = getThread(threadId);
      setThread(th);

      const otherId = me?.id ? (th.a === me.id ? th.b : th.a) : th.a;
      setOther(otherId ? getProfileById(otherId) : null);
    } catch (e: any) {
      setErr(e?.message ?? "Thread not found");
      setThread(null);
      setOther(null);
    }
  }, [threadId, me?.id]);

  useEffect(() => {
    // auto scroll to bottom when messages change
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  function send() {
    const msg = text.trim();
    if (!msg) return;

    try {
      setBusy(true);
      setErr("");
      const updated = sendChatMessage(threadId, msg);
      setThread(updated);
      setText("");
    } catch (e: any) {
      setErr(e?.message ?? "Send failed");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  const inputCls =
    "flex-1 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/40";

  const btnPrimary =
    "rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition";

  const btnGhost =
    "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10 transition";

  if (err && !thread) {
    return (
      <div className="space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <div className="text-white font-semibold">Chat</div>
          <div className="mt-2 text-sm text-red-200">{err}</div>
          <div className="mt-4">
            <Link href="/member/chat" className={btnGhost}>
              Back to chats
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) return null;

  const otherPhoto = other?.photos?.[0] ?? "";
  const loc = [other?.city, other?.state, other?.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shrink-0">
              {otherPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherPhoto} alt={other?.fullName ?? "User"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  No photo
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-2xl font-semibold text-white truncate">
                {other?.fullName ?? "Chat"}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {loc || (other?.id ?? "")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Thread: {thread.id} • Started {fmtTime(thread.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/member/chat" className={btnGhost}>
              Back
            </Link>
            {other?.id ? (
              <Link href={`/u/${other.id}`} className={btnGhost}>
                View Profile
              </Link>
            ) : null}
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div className="rounded-[28px] border border-white/10 bg-slate-950/30 p-5 md:p-6">
        {thread.messages.length === 0 ? (
          <div className="p-10 text-center text-slate-300">
            No messages yet.
            <div className="mt-2 text-sm text-slate-400">Say hi 👋</div>
          </div>
        ) : (
          <div className="space-y-3">
            {thread.messages.map((m) => {
              const mine = m.from === me?.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl border border-white/10 px-4 py-3 text-sm ${
                      mine ? "bg-white/10 text-white" : "bg-white/5 text-slate-200"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                    <div className="mt-2 text-[10px] text-slate-400">{fmtTime(m.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 md:p-5 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type message..."
          className={inputCls}
        />
        <button
          onClick={send}
          disabled={busy}
          className={`${btnPrimary} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
