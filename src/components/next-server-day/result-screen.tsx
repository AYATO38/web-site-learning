import Link from "next/link";
import { Trophy, Medal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/next-server-day";
import {
  teamFinished,
  teamXp,
  type Room,
  type TeamStatus,
} from "@/lib/nsd-room";
import { LiveBoard } from "@/components/next-server-day/live-board";

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
}: {
  room: Room;
  myTeam: string;
  myMemberId?: string | null;
  correctCount: number;
  total: number;
  xp: number;
  bestCombo: number;
  onRestart: () => void;
}) {
  const ranked = [...room.teams]
    .filter((team) => team.members.length > 0)
    .sort((a, b) => teamXp(b) - teamXp(a));
  const myRank = ranked.findIndex((t) => t.name === myTeam);
  const allDone = room.teams.every(
    (team) => team.members.length === 0 || teamFinished(team),
  );
  const winner = ranked[0];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
      <p className="section-en text-center">Result</p>
      <h1 className="event-title mt-2 text-center">結果発表</h1>
      <span className="rule-line mx-auto mt-3" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {allDone
          ? "全チームの結果が出そろいました"
          : "他のメンバーの完了を待っています"}
      </p>

      {allDone ? (
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
                  isMine={team.name === myTeam}
                />
              ))}
            </ol>
          </section>
        </>
      ) : (
        <div className="mt-8">
          <LiveBoard room={room} myTeam={myTeam} myMemberId={myMemberId} />
        </div>
      )}

      <section className="event-card mt-4 rounded-2xl p-5">
        <p className="section-en">{myTeam}</p>
        <h2 className="mt-1 text-base font-bold">あなたの成績</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {allDone && (
            <Stat label="チーム順位" value={myRank >= 0 ? rankLabel(myRank) : "-"} />
          )}
          <Stat label="獲得XP" value={`${xp}`} />
          <Stat label="正解数" value={`${correctCount} / ${total}`} />
          <Stat
            label="最高コンボ"
            value={bestCombo >= 2 ? `${bestCombo}連続` : `${bestCombo}`}
          />
        </dl>
      </section>

      <button
        type="button"
        onClick={onRestart}
        className="event-cta mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-semibold"
      >
        <RotateCcw className="size-5" />
        もう一度挑戦
      </button>
      <Link
        href="/"
        className="mt-4 text-center text-sm text-muted-foreground"
      >
        ホームに戻る
      </Link>
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
}: {
  team: TeamStatus;
  index: number;
  isMine: boolean;
}) {
  const xp = teamXp(team);
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
            {` · ${team.members.map((member) => member.name).join("、")}`}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-base font-black tabular-nums">{xp} XP</p>
    </li>
  );
}
