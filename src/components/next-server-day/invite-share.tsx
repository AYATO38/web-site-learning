"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

function invitePath(roomId: string) {
  return `/next-server-day?room=${encodeURIComponent(roomId)}`;
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function InviteShare({ roomId }: { roomId: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function load() {
      const fallback = `${window.location.origin}${invitePath(roomId)}`;
      if (!isLocalHost(window.location.hostname)) {
        if (!cancelled) setUrl(fallback);
        return;
      }

      try {
        const res = await fetch("/api/nsd/share-origin", { cache: "no-store" });
        const body = (await res.json()) as { origin?: string | null };
        const origin =
          typeof body.origin === "string" ? body.origin.replace(/\/$/, "") : "";
        if (!cancelled) {
          setUrl(origin ? `${origin}${invitePath(roomId)}` : fallback);
          if (origin && timer) window.clearInterval(timer);
        }
      } catch {
        if (!cancelled) setUrl(fallback);
      }
    }

    void load();
    if (isLocalHost(window.location.hostname)) {
      timer = window.setInterval(() => void load(), 3000);
    }
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [roomId]);

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard may be blocked */
    }
  }

  const usingPublic = url.startsWith("https://") && !url.includes("localhost");

  return (
    <div className="event-card mb-6 rounded-2xl p-4 text-left">
      <p className="section-en">Invite</p>
      <h3 className="mt-1 text-base font-bold">リンクで招待する</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {usingPublic
          ? "このリンクを送ると、Wi-Fiが違っても同じ部屋に入れます。"
          : "同じ公開URLで招待します。開発中の最新は、デスクトップの POSSE からも開けます。"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">
          {url || "読み込み中..."}
        </p>
        <button
          type="button"
          onClick={() => void copy(url, "link")}
          disabled={!url}
          className="flex size-10 shrink-0 items-center justify-center rounded-full event-cta"
          aria-label="招待リンクをコピー"
        >
          {copied === "link" ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={() => void copy(roomId, "code")}
        className="mt-2 text-xs font-bold text-accent"
      >
        {copied === "code" ? "コードをコピーしました" : `部屋コード ${roomId} をコピー`}
      </button>
    </div>
  );
}
