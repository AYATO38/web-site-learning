"use client";

import { Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import type { PendingPlayer } from "@/lib/nsd-room";

const MAX_SHOWN = 8;

/**
 * Shown in the footer right where the answer button was, instead of
 * navigating to a separate screen — the player stays put, seeing their own
 * (now locked) answer, while this banner tracks who's still working on the
 * question. Once everyone's answered, the standings reveal takes over on its
 * own; leaving when that happens is otherwise out of the player's hands, so a
 * skip link stays available in case someone is stuck.
 */
export function WaitingBanner({
  pending,
  onSkip,
}: {
  pending: PendingPlayer[];
  onSkip: () => void;
}) {
  const shown = pending.slice(0, MAX_SHOWN);
  const extra = pending.length - shown.length;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-extrabold leading-snug">
          回答完了！他の人が終わるまで待っててね！
        </p>
        {pending.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              あと {pending.length}人が回答中です
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {shown.map((player) => (
                <PlayerAvatar
                  key={player.id}
                  outfit={player.outfit}
                  name={player.name}
                  size="sm"
                  className="size-7 opacity-70"
                />
              ))}
              {extra > 0 ? (
                <span className="text-xs font-bold text-muted-foreground">
                  +{extra}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            まもなく順位を発表します
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="shrink-0 text-xs font-bold text-accent"
      >
        待たずに見る
      </button>
    </div>
  );
}
