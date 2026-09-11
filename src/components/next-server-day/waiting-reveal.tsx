"use client";

import { Loader2 } from "lucide-react";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import type { PendingPlayer } from "@/lib/nsd-room";

/**
 * Shown right after a player answers, before the per-question standings are
 * revealed. Waits for everyone else still active to finish this question too,
 * so the reveal lands for the room together instead of one person at a time.
 */
export function WaitingReveal({
  pending,
  questionNumber,
  total,
  onSkip,
}: {
  pending: PendingPlayer[];
  questionNumber: number;
  total: number;
  onSkip: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-5 py-10 text-center">
      <p className="section-en">Waiting</p>
      <h1 className="event-title mt-2">みんなの回答を待っています</h1>
      <span className="rule-line mt-3" />
      <p className="mt-2 text-sm text-muted-foreground">
        第 {questionNumber} 問 · 全 {total} 問
      </p>

      <Loader2 className="mt-8 size-8 animate-spin text-accent" />

      {pending.length > 0 ? (
        <>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            あと {pending.length}人が回答中です
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-3">
            {pending.map((player) => (
              <li
                key={player.id}
                className="flex flex-col items-center gap-1.5"
              >
                <PlayerAvatar
                  outfit={player.outfit}
                  name={player.name}
                  size="md"
                  className="opacity-60"
                />
                <span className="max-w-16 truncate text-[11px] font-semibold text-muted-foreground">
                  {player.name}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-5 text-sm font-semibold text-muted-foreground">
          まもなく順位を発表します
        </p>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 text-sm font-bold text-accent"
      >
        待たずに見る
      </button>
    </div>
  );
}
