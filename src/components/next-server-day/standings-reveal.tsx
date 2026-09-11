"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import { playResultSfx } from "@/lib/sfx";
import type { RankedPlayer } from "@/lib/nsd-room";

const STAGGER_MS = 80;
const STAGGER_CAP = 12;

/**
 * Kahoot-style standings shown between questions. The list is a frozen snapshot
 * so the reveal animation is not disturbed by live polling. Rows fly in from the
 * bottom rank up to first place, and each row carries how far the player moved
 * since the previous reveal.
 */
export function StandingsReveal({
  snapshot,
  previousRanks,
  myMemberId,
  questionNumber,
  total,
  isLast,
  onContinue,
}: {
  snapshot: RankedPlayer[];
  previousRanks: Map<string, number> | null;
  myMemberId: string | null;
  questionNumber: number;
  total: number;
  isLast: boolean;
  onContinue: () => void;
}) {
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [shown, setShown] = useState(reduceMotion);

  useEffect(() => {
    void playResultSfx();
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setShown(true), 60);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const lastIndex = snapshot.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
      <p className="section-en text-center">Ranking</p>
      <h1 className="event-title mt-2 text-center">順位発表</h1>
      <span className="rule-line mx-auto mt-3" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        第 {questionNumber} 問しゅうりょう · 全 {total} 問
      </p>

      <ol className="mt-8 flex flex-col gap-2">
        {snapshot.map((player, index) => {
          const previous = previousRanks?.get(player.id);
          const isNew = previousRanks != null && previous == null;
          const delta = previous == null ? null : previous - index;
          const isMine = player.id === myMemberId;
          const revealOrder = Math.min(lastIndex - index, STAGGER_CAP);

          return (
            <li
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition-all duration-500 ease-out",
                index === 0
                  ? "bg-gradient-to-r from-[#c9a39a]/25 to-transparent ring-[#c9a39a]/50"
                  : "bg-muted ring-transparent",
                isMine && "ring-accent",
                shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: `${revealOrder * STAGGER_MS}ms` }}
            >
              <span className="flex w-6 shrink-0 items-center justify-center text-lg font-black tabular-nums">
                {index === 0 ? (
                  <Trophy className="size-5 text-accent" />
                ) : (
                  index + 1
                )}
              </span>
              <PlayerAvatar outfit={player.outfit} name={player.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {player.name}
                  {isMine ? "（あなた）" : ""}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {player.teamName}
                  {player.combo >= 2 ? ` · ${player.combo}連続` : ""}
                </p>
              </div>
              <DeltaBadge delta={delta} isNew={isNew} />
              <span className="w-14 shrink-0 text-right text-sm font-black tabular-nums">
                {player.xp}
                <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">
                  XP
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onContinue}
        className="event-cta mt-8 w-full rounded-full py-4 text-lg font-bold"
      >
        {isLast ? "結果を見る" : "次の問題へ"}
      </button>
    </div>
  );
}

function DeltaBadge({ delta, isNew }: { delta: number | null; isNew: boolean }) {
  if (isNew) {
    return (
      <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-black text-accent">
        NEW
      </span>
    );
  }
  if (delta == null) {
    return (
      <span className="w-10 shrink-0 text-center text-xs font-bold text-muted-foreground">
        —
      </span>
    );
  }
  if (delta === 0) {
    return (
      <span className="flex w-10 shrink-0 items-center justify-center gap-0.5 text-xs font-bold text-muted-foreground">
        <Minus className="size-3" strokeWidth={3} />0
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "flex w-10 shrink-0 items-center justify-center gap-0.5 text-xs font-black tabular-nums",
        up ? "text-accent" : "text-wrong",
      )}
    >
      {up ? (
        <ChevronUp className="size-3.5" strokeWidth={3} />
      ) : (
        <ChevronDown className="size-3.5" strokeWidth={3} />
      )}
      {Math.abs(delta)}
    </span>
  );
}
