"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { QUESTION_TIME_LIMIT_LABEL } from "@/lib/next-server-day";
import { GALLERY_MAX, isHost, updateRoomSettings, type Room } from "@/lib/nsd-room";
import { Minus, Plus } from "lucide-react";

const NOTICE_MS = 12000;

export function RoomSettingsPanel({
  room,
  memberId,
  onUpdated,
}: {
  room: Room;
  memberId: string | null;
  onUpdated: (room: Room) => void;
}) {
  const master = isHost(room, memberId);
  const canEditGallery = master;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const fresh =
    Boolean(room.settingsUpdatedAt) &&
    now - (room.settingsUpdatedAt ?? 0) < NOTICE_MS;

  async function patch(
    settings: { galleryCapacity?: number },
  ) {
    if (!memberId) return;
    setBusy(true);
    setError(null);
    try {
      const next = await updateRoomSettings(room.id, memberId, settings);
      onUpdated(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定を保存できませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={cn(
        "event-card mb-5 rounded-[1.4rem] p-5",
        fresh && "ring-2 ring-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-en">Room settings</p>
          <h3 className="text-base font-bold">部屋の設定</h3>
        </div>
        {room.host ? (
          <p className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
            ルームマスター {room.host.name}
          </p>
        ) : null}
      </div>

      {fresh && room.settingsNotice ? (
        <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm font-bold text-accent">
          {room.settingsNotice}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {master
            ? "ここを変えると、他の参加者の画面にもすぐ反映されます。"
            : "ルームマスターが変えた設定は、この画面にすぐ出ます。"}
        </p>
      )}

      <p className="mt-4 text-sm font-bold">1問の制限時間</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {QUESTION_TIME_LIMIT_LABEL}（固定）
      </p>

      <p className="mt-4 text-sm font-bold">ギャラリー枠</p>
      <p className="mt-1 text-xs text-muted-foreground">
        いま: {room.gallery.length}/{room.galleryCapacity}席
      </p>
      {canEditGallery ? (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            disabled={busy || room.galleryCapacity <= room.gallery.length}
            onClick={() =>
              void patch({ galleryCapacity: room.galleryCapacity - 1 })
            }
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface-elevated disabled:opacity-40"
            aria-label="ギャラリー枠を減らす"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-10 text-center text-2xl font-extrabold tabular-nums text-accent">
            {room.galleryCapacity}
          </span>
          <button
            type="button"
            disabled={busy || room.galleryCapacity >= GALLERY_MAX}
            onClick={() =>
              void patch({ galleryCapacity: room.galleryCapacity + 1 })
            }
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface-elevated disabled:opacity-40"
            aria-label="ギャラリー枠を増やす"
          >
            <Plus className="size-4" />
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-semibold text-wrong">{error}</p>
      ) : null}
    </section>
  );
}
