"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Trophy, Medal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS, nextDifficulty, type Difficulty } from "@/lib/next-server-day";
import {
  allTeamsDone,
  isHost,
  lockedDifficulty,
  teamOverallXp,
  teamXp,
  type Room,
  type TeamStatus,
} from "@/lib/nsd-room";
import { LiveBoard } from "@/components/next-server-day/live-board";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import { PodiumCelebration } from "@/components/next-server-day/podium-celebration";
import { rankAccent, rankIconColor } from "@/lib/nsd-rank-colors";
import {
  DRUMROLL_MS,
  GRAND_DRUMROLL_MS,
  playDrumrollSfx,
  playFanfareSfx,
  playGrandDrumrollSfx,
  playResultSfx,
  stopDrumrollSfx,
} from "@/lib/sfx";

/** Each difficulty's own ranking says "1位" — only the final, cumulative ranking calls it 優勝. */
function rankLabel(index: number, championLabel: string = "1位") {
  if (index === 0) return championLabel;
  if (index === 1) return "2位";
  if (index === 2) return "3位";
  return `${index + 1}位`;
}

export function ResultScreen({
  room,
  myTeam,
  myMemberId,
  correctCount,
  total,
  xp,
  bestCombo,
  attempt = 0,
  onRestart,
  onAdvanceDifficulty,
  onRevealResults,
  onRevealFinalResults,
  onAdvanceFinalRankStep,
  spectator = false,
}: {
  room: Room;
  myTeam?: string | null;
  myMemberId?: string | null;
  correctCount: number;
  total: number;
  xp: number;
  bestCombo: number;
  /** A solo "もう一度挑戦" replay (> 0) paces its own reveal, skipping the room-wide gates below. */
  attempt?: number;
  onRestart: () => void;
  onAdvanceDifficulty: (next: Difficulty) => void;
  onRevealResults: () => void;
  onRevealFinalResults: () => void;
  onAdvanceFinalRankStep: (step: number) => void;
  spectator?: boolean;
}) {
  const ranked = [...room.teams]
    .filter((team) => team.members.length > 0)
    .sort((a, b) => teamXp(b) - teamXp(a));
  const myRank = ranked.findIndex((t) => t.name === myTeam);
  const allDone = allTeamsDone(room);
  const winner = ranked[0];
  const upNext = nextDifficulty(lockedDifficulty(room) ?? "advanced");
  // Everyone (including the room master's own screen) waits for the room
  // master to press 結果発表へ before the drumroll starts, so the reveal
  // lands as one shared moment instead of leaking out as each person happens
  // to finish — except a solo replay, which has no one else to sync with.
  const readyForDrumroll = allDone && (attempt > 0 || room.resultsReleased);
  // No next difficulty to advance to — this run's own ranking (still just
  // its own XP, unchanged) can be followed by a second, further reveal: the
  // cumulative ranking across every difficulty played in this room, behind
  // its own room-master gate and its own (grander) drumroll.
  const isFinalStage = upNext === null;
  const finalGateOpen =
    isFinalStage && (attempt > 0 || room.finalResultsReleased);
  const overallRanked = [...room.teams]
    .filter((team) => team.members.length > 0)
    .sort((a, b) => teamOverallXp(b) - teamOverallXp(a));
  // The countdown ceremony's reveal order — indexes into overallRanked, from
  // 3rd place up to 1st (fewer steps if there aren't 3 teams to rank).
  const podiumOrder = [2, 1, 0].filter((index) => index < overallRanked.length);
  // A solo replay has no one to sync a countdown with, so it just sees
  // everything at once, same as it already skips the other final-stage gates.
  const finalRankStep =
    attempt > 0
      ? podiumOrder.length
      : Math.min(room.finalRankStep ?? 0, podiumOrder.length);
  const pendingFinalRankReveal = finalRankStep < podiumOrder.length;
  const nextPodiumRank =
    pendingFinalRankReveal ? podiumOrder[finalRankStep] + 1 : null;
  const remainingRankedTeams = overallRanked.filter(
    (_, index) => !podiumOrder.includes(index),
  );
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  function reveal() {
    if (revealedRef.current) return;
    revealedRef.current = true;
    stopDrumrollSfx();
    setRevealed(true);
    void playResultSfx();
  }

  useEffect(() => {
    if (!readyForDrumroll) {
      revealedRef.current = false;
      setRevealed(false);
      stopDrumrollSfx();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      reveal();
      return;
    }

    void playDrumrollSfx();
    const timer = window.setTimeout(reveal, DRUMROLL_MS);
    return () => {
      window.clearTimeout(timer);
      stopDrumrollSfx();
    };
  }, [readyForDrumroll]);

  const [finalDrumrollDone, setFinalDrumrollDone] = useState(false);
  const finalDrumrollRef = useRef(false);

  function revealFinal() {
    if (finalDrumrollRef.current) return;
    finalDrumrollRef.current = true;
    stopDrumrollSfx();
    setFinalDrumrollDone(true);
    void playFanfareSfx();
  }

  useEffect(() => {
    if (!finalGateOpen) {
      finalDrumrollRef.current = false;
      setFinalDrumrollDone(false);
      stopDrumrollSfx();
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      revealFinal();
      return;
    }

    void playGrandDrumrollSfx();
    const timer = window.setTimeout(revealFinal, GRAND_DRUMROLL_MS);
    return () => {
      window.clearTimeout(timer);
      stopDrumrollSfx();
    };
  }, [finalGateOpen]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
      <p className="section-en text-center">Result</p>
      <h1 className="event-title mt-2 text-center">結果発表</h1>
      <span className="rule-line mx-auto mt-3" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {!allDone
          ? "他のメンバーの完了を待っています"
          : !readyForDrumroll
            ? "ルームマスターの結果発表をお待ちください"
            : !revealed
              ? "まもなく発表します"
              : finalGateOpen && !finalDrumrollDone
                ? "まもなく最終結果を発表します"
                : "全チームの結果が出そろいました"}
      </p>

      {!allDone ? (
        <div className="mt-8">
          <LiveBoard room={room} myTeam={myTeam} myMemberId={myMemberId} />
        </div>
      ) : !readyForDrumroll ? (
        isHost(room, myMemberId) ? (
          <button
            type="button"
            onClick={onRevealResults}
            className="event-cta mt-8 w-full rounded-full py-4 text-lg font-bold"
          >
            結果発表へ
          </button>
        ) : (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            ルームマスターが結果発表を開始するのを待っています
          </p>
        )
      ) : !revealed ? (
        <Drumroll onSkip={reveal} />
      ) : finalGateOpen && !finalDrumrollDone ? (
        <Drumroll onSkip={revealFinal} grand />
      ) : finalGateOpen ? (
        <>
          {[...podiumOrder.slice(0, finalRankStep)].reverse().map((rankIndex) => {
            const team = overallRanked[rankIndex];
            if (!team) return null;
            if (rankIndex === 0) {
              return <PodiumCelebration key={team.name} team={team} />;
            }
            return (
              <div
                key={team.name}
                className="event-card mt-6 rounded-2xl p-5 text-center"
              >
                <p
                  className={cn(
                    "text-sm font-bold",
                    rankIndex === 1 ? "text-[#8a8f99]" : "text-[#a5652e]",
                  )}
                >
                  {rankIndex + 1}位
                </p>
                <p className="mt-1 text-xl font-black">{team.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {teamOverallXp(team)} XP · {team.members.length}人
                </p>
              </div>
            );
          })}

          {!pendingFinalRankReveal && remainingRankedTeams.length > 0 ? (
            <section className="event-card mt-6 rounded-2xl p-4">
              <p className="section-en">Final</p>
              <h2 className="mt-1 text-base font-bold">最終結果発表</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                初級・中級・上級の合計ポイントです
              </p>
              <ol className="mt-4 flex flex-col gap-2">
                {remainingRankedTeams.map((team) => (
                  <RankRow
                    key={team.name}
                    team={team}
                    index={overallRanked.indexOf(team)}
                    isMine={Boolean(myTeam && team.name === myTeam)}
                    room={room}
                    xp={teamOverallXp(team)}
                  />
                ))}
              </ol>
            </section>
          ) : null}

          {pendingFinalRankReveal ? (
            isHost(room, myMemberId) ? (
              <button
                type="button"
                onClick={() => onAdvanceFinalRankStep(finalRankStep + 1)}
                className="event-cta mt-6 w-full rounded-full py-4 text-lg font-bold"
              >
                {nextPodiumRank}位を発表
              </button>
            ) : (
              <p className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                ルームマスターが{nextPodiumRank}位を発表するのを待っています
              </p>
            )
          ) : null}
        </>
      ) : (
        <>
          {winner && (
            <div className="event-card mt-8 rounded-2xl p-5 text-center">
              <Trophy className="mx-auto size-10 text-accent" />
              <p className="mt-3 text-sm font-bold text-accent">1位チーム</p>
              <p className="mt-1 text-2xl font-black">{winner.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {teamXp(winner)} XP · {winner.members.length}人
              </p>
            </div>
          )}

          <section className="event-card mt-6 rounded-2xl p-4">
            <p className="section-en">Ranking</p>
            <h2 className="mt-1 text-base font-bold">最終順位</h2>
            <ol className="mt-4 flex flex-col gap-2">
              {ranked.map((team, index) => (
                <RankRow
                  key={team.name}
                  team={team}
                  index={index}
                  isMine={Boolean(myTeam && team.name === myTeam)}
                  room={room}
                  xp={teamXp(team)}
                />
              ))}
            </ol>
          </section>

          {isFinalStage ? (
            isHost(room, myMemberId) ? (
              <button
                type="button"
                onClick={onRevealFinalResults}
                className="event-cta mt-6 w-full rounded-full py-4 text-lg font-bold"
              >
                最終結果発表を見る
              </button>
            ) : (
              <p className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                ルームマスターが最終結果発表を開始するのを待っています
              </p>
            )
          ) : null}
        </>
      )}

      {revealed || !readyForDrumroll ? (
        <>
          <section className="event-card mt-4 rounded-2xl p-5">
            <p className="section-en">{spectator ? "Gallery" : myTeam}</p>
            <h2 className="mt-1 text-base font-bold">
              {spectator ? "ギャラリー観戦" : "あなたの成績"}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {spectator ? (
                <Stat
                  label="観戦"
                  value={`${room.gallery.length}/${room.galleryCapacity}席`}
                />
              ) : (
                <>
                  {allDone && revealed && (
                    <Stat
                      label="チーム順位"
                      value={myRank >= 0 ? rankLabel(myRank) : "-"}
                    />
                  )}
                  <Stat label="獲得XP" value={`${xp}`} />
                  <Stat label="正解数" value={`${correctCount} / ${total}`} />
                  <Stat
                    label="最高コンボ"
                    value={bestCombo >= 2 ? `${bestCombo}連続` : `${bestCombo}`}
                  />
                </>
              )}
            </dl>
          </section>

          {allDone && revealed && upNext ? (
            isHost(room, myMemberId) ? (
              <button
                type="button"
                onClick={() => onAdvanceDifficulty(upNext)}
                className="event-cta mt-8 w-full rounded-full py-4 text-lg font-bold"
              >
                {DIFFICULTY_LABELS[upNext].label}に進む
              </button>
            ) : (
              <p className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                ルームマスターが次の難易度に進めるのを待っています
              </p>
            )
          ) : null}

          {spectator ? null : (
            <button
              type="button"
              onClick={onRestart}
              className="event-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-semibold"
            >
              <RotateCcw className="size-5" />
              もう一度挑戦
            </button>
          )}
          <Link
            href="/"
            className="mt-4 text-center text-sm text-muted-foreground"
          >
            ホームに戻る
          </Link>
        </>
      ) : null}
    </div>
  );
}

function Drumroll({
  onSkip,
  grand = false,
}: {
  onSkip: () => void;
  /** The final-results drumroll: bigger card, more bars, longer roll. */
  grand?: boolean;
}) {
  const bars = grand ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
  return (
    <div
      className={cn(
        "event-card mt-8 overflow-hidden rounded-2xl text-center",
        grand ? "p-10" : "p-8",
      )}
    >
      <p className="section-en">{grand ? "Final Drumroll" : "Drumroll"}</p>
      <p
        className={cn(
          "mt-2 font-black tracking-tight",
          grand ? "text-2xl" : "text-lg",
        )}
      >
        ドラムロール…
      </p>
      <div
        className={cn(
          "flex items-end justify-center gap-2",
          grand ? "mt-8 h-24" : "mt-6 h-16",
        )}
      >
        {bars.map((index) => (
          <span
            key={index}
            className={cn(
              "rounded-full bg-accent",
              grand ? "drum-bar-grand w-3.5" : "drum-bar w-2.5",
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-foreground">
        {grand ? "最終結果を発表します" : "順位を発表します"}
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm font-bold text-accent"
      >
        とばす
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}

function RankRow({
  team,
  index,
  isMine,
  room,
  xp,
  championLabel,
}: {
  team: TeamStatus;
  index: number;
  isMine: boolean;
  room: Room;
  xp: number;
  /** What 1st place is called on this list — "1位" for each difficulty's own ranking, "優勝" only for the final one. */
  championLabel?: string;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r px-3 py-3 ring-1",
        rankAccent(index),
        isMine && "ring-accent",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-sm font-black">
          {index < 3 ? (
            <Medal className={cn("size-4", rankIconColor(index))} />
          ) : (
            index + 1
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">
            {rankLabel(index, championLabel)} {team.name}
            {isMine ? "（自分）" : ""}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {team.difficulty ? DIFFICULTY_LABELS[team.difficulty].label : "未挑戦"}
            {` · ${team.members.length}人`}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-1 rounded-full bg-background/70 py-0.5 pr-2 pl-0.5"
              >
                <PlayerAvatar
                  outfit={member.outfit}
                  name={member.name}
                  size="sm"
                  className="size-5 ring-1"
                />
                <span className="text-[11px] font-semibold">
                  {member.name}
                  {room.host?.memberId === member.id ? "（マスター）" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="shrink-0 text-base font-black tabular-nums">{xp} XP</p>
    </li>
  );
}
