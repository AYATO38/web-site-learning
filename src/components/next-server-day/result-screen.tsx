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
import {
  DRUMROLL_MS,
  playDrumrollSfx,
  playResultSfx,
  stopDrumrollSfx,
} from "@/lib/sfx";

function rankLabel(index: number) {
  if (index === 0) return "優勝";
  if (index === 1) return "2位";
  if (index === 2) return "3位";
  return `${index + 1}位`;
}

function rankAccent(index: number) {
  if (index === 0) return "from-[#c9a39a]/30 to-transparent ring-[#c9a39a]/50";
  if (index === 1) return "from-foreground/5 to-transparent ring-border";
  if (index === 2) return "from-[#d4c4b0]/50 to-transparent ring-[#d4c4b0]";
  return "from-transparent to-transparent ring-transparent";
}

export function ResultScreen({
  room,
  myTeam,
  myMemberId,
  correctCount,
  total,
  xp,
  bestCombo,
  onRestart,
  onAdvanceDifficulty,
  spectator = false,
}: {
  room: Room;
  myTeam?: string | null;
  myMemberId?: string | null;
  correctCount: number;
  total: number;
  xp: number;
  bestCombo: number;
  onRestart: () => void;
  onAdvanceDifficulty: (next: Difficulty) => void;
  spectator?: boolean;
}) {
  const ranked = [...room.teams]
    .filter((team) => team.members.length > 0)
    .sort((a, b) => teamXp(b) - teamXp(a));
  const overallRanked = [...room.teams]
    .filter((team) => team.members.length > 0)
    .sort((a, b) => teamOverallXp(b) - teamOverallXp(a));
  const myRank = ranked.findIndex((t) => t.name === myTeam);
  const allDone = allTeamsDone(room);
  const winner = ranked[0];
  const upNext = nextDifficulty(lockedDifficulty(room) ?? "advanced");
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
    if (!allDone) {
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
  }, [allDone]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
      <p className="section-en text-center">Result</p>
      <h1 className="event-title mt-2 text-center">結果発表</h1>
      <span className="rule-line mx-auto mt-3" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {!allDone
          ? "他のメンバーの完了を待っています"
          : revealed
            ? "全チームの結果が出そろいました"
            : "まもなく発表します"}
      </p>

      {allDone && !revealed ? (
        <Drumroll onSkip={reveal} />
      ) : allDone ? (
        <>
          {winner && (
            <div className="event-card mt-8 rounded-2xl p-5 text-center">
              <Trophy className="mx-auto size-10 text-accent" />
              <p className="mt-3 text-sm font-bold text-accent">優勝チーム</p>
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

          {!upNext ? (
            <section className="event-card mt-6 rounded-2xl p-4">
              <p className="section-en">Overall</p>
              <h2 className="mt-1 text-base font-bold">総合順位</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                これまでに挑戦した難易度の合計ポイントです
              </p>
              <ol className="mt-4 flex flex-col gap-2">
                {overallRanked.map((team, index) => (
                  <RankRow
                    key={team.name}
                    team={team}
                    index={index}
                    isMine={Boolean(myTeam && team.name === myTeam)}
                    room={room}
                    xp={teamOverallXp(team)}
                  />
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : (
        <div className="mt-8">
          <LiveBoard room={room} myTeam={myTeam} myMemberId={myMemberId} />
        </div>
      )}

      {revealed || !allDone ? (
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

function Drumroll({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="event-card mt-8 overflow-hidden rounded-2xl p-8 text-center">
      <p className="section-en">Drumroll</p>
      <p className="mt-2 text-lg font-black tracking-tight">ドラムロール…</p>
      <div className="mt-6 flex h-16 items-end justify-center gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className="drum-bar w-2.5 rounded-full bg-accent"
            style={{ animationDelay: `${index * 80}ms` }}
          />
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-foreground">
        優勝チームを発表します
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
}: {
  team: TeamStatus;
  index: number;
  isMine: boolean;
  room: Room;
  xp: number;
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
          {index < 3 ? <Medal className="size-4 text-accent" /> : index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold">
            {rankLabel(index)} {team.name}
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
