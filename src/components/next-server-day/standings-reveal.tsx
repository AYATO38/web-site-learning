"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionBubble } from "@/components/question-bubble";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import { CodeDiffView } from "@/components/next-server-day/code-diff-view";
import { CodeExampleView } from "@/components/next-server-day/code-example-view";
import { playResultSfx } from "@/lib/sfx";
import type { DiffLine } from "@/lib/nsd-code-diff";
import type { TemplateFill } from "@/lib/nsd-grade";
import type { RankedPlayer } from "@/lib/nsd-room";

const STAGGER_MS = 80;
const STAGGER_CAP = 12;
const FLIP_MS = 700;
const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REORDER_DELAY_MS = 1100;

export type StandingsRecap = {
  result: "correct" | "wrong";
  title: string;
  /** So the question stays visible on this screen, not just during "answering". */
  prompt: string;
  code?: string;
  gain: { xp: number; bonus: number } | null;
  explanation: string;
  /** Choice/order: what the player answered, as plain text. */
  yourAnswer?: string | null;
  /** Choice/order: the correct answer, as plain text. */
  correctAnswer?: string | null;
  /** Blank: what the player filled in — an empty blank renders as its own marked word. */
  yourAnswerFill?: TemplateFill | null;
  /** Blank: the correct fill. */
  correctAnswerFill?: TemplateFill | null;
  /** Bugfix questions answered wrong: the student's code diffed against the model solution. */
  codeDiff?: DiffLine[] | null;
  /** Bugfix questions: the clean full solution, shown alongside the diff. */
  solution?: string | null;
  /** Code questions: the player's own submitted code. */
  yourCode?: string | null;
  /** Code questions: the worked example, shown as reference regardless of correct/wrong. */
  codeExample?: string | null;
};

/** Rows start lined up in last reveal's order, so the shuffle below is visible. */
function orderByPreviousRank(
  snapshot: RankedPlayer[],
  previousRanks: Map<string, number> | null,
): RankedPlayer[] {
  if (!previousRanks) return snapshot;
  return [...snapshot].sort((a, b) => {
    const rankA = previousRanks.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rankB = previousRanks.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });
}

/**
 * Kahoot-style standings shown between questions. The snapshot is frozen so
 * live polling can't disturb the reveal. The first-ever reveal counts up from
 * the bottom rank to first place; every reveal after that lines rows up in
 * last round's order first, then physically slides them into their new
 * positions (a FLIP animation, same technique as the drag-reorder question
 * type), so a rank change is something you watch happen, not just a number.
 * During the live synced round the room master decides when everyone moves
 * on — everyone else sees a passive "waiting for the master" state instead of
 * a button; a solo replay paces itself, so it always gets the active button
 * (`canAdvance`).
 */
export function StandingsReveal({
  snapshot,
  previousRanks,
  myMemberId,
  questionNumber,
  total,
  isLast,
  canAdvance,
  onAdvance,
  recap,
}: {
  snapshot: RankedPlayer[];
  previousRanks: Map<string, number> | null;
  myMemberId: string | null;
  questionNumber: number;
  total: number;
  isLast: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
  recap: StandingsRecap | null;
}) {
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [shown, setShown] = useState(reduceMotion);
  const [order, setOrder] = useState(() =>
    reduceMotion ? snapshot : orderByPreviousRank(snapshot, previousRanks),
  );
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLLIElement>());
  const flipFromRef = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    void playResultSfx();
    if (reduceMotion) return;
    const showTimer = window.setTimeout(() => setShown(true), 60);
    let reorderTimer: number | undefined;
    if (previousRanks) {
      reorderTimer = window.setTimeout(() => {
        const tops = new Map<string, number>();
        nodeRefs.current.forEach((node, id) => {
          tops.set(id, node.getBoundingClientRect().top);
        });
        flipFromRef.current = tops;
        setOrder(snapshot);
      }, REORDER_DELAY_MS);
    }
    return () => {
      window.clearTimeout(showTimer);
      if (reorderTimer !== undefined) window.clearTimeout(reorderTimer);
    };
    // Runs once on mount — snapshot/previousRanks are a frozen prop pair for
    // this reveal's whole lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useLayoutEffect(() => {
    const from = flipFromRef.current;
    if (!from) return;
    flipFromRef.current = null;
    order.forEach((player) => {
      const node = nodeRefs.current.get(player.id);
      if (!node) return;
      const prevTop = from.get(player.id);
      if (prevTop == null) return;
      const dy = prevTop - node.getBoundingClientRect().top;
      if (Math.abs(dy) < 0.5) return;
      node.style.transition = "none";
      node.style.transform = `translateY(${dy}px)`;
      node.getBoundingClientRect();
      node.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
      node.style.transform = "";
    });
  }, [order]);

  const finalRank = new Map(snapshot.map((player, index) => [player.id, index]));
  const lastIndex = order.length - 1;
  const reordering = previousRanks != null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
      <p className="section-en text-center">Ranking</p>
      <h1 className="event-title mt-2 text-center">順位発表</h1>
      <span className="rule-line mx-auto mt-3" />
      <p className="mt-2 text-center text-sm text-muted-foreground">
        第 {questionNumber} 問しゅうりょう · 全 {total} 問
      </p>

      {recap ? (
        <>
          <QuestionBubble prompt={recap.prompt} code={recap.code} />
          <RecapCard recap={recap} />
        </>
      ) : null}

      <ol className="mt-8 flex flex-col gap-2">
        {order.map((player, renderIndex) => {
          const index = finalRank.get(player.id) ?? renderIndex;
          const previous = previousRanks?.get(player.id);
          const isNew = previousRanks != null && previous == null;
          const delta = previous == null ? null : previous - index;
          const isMine = player.id === myMemberId;
          const revealOrder = reordering
            ? 0
            : Math.min(lastIndex - renderIndex, STAGGER_CAP);

          return (
            <li
              key={player.id}
              ref={(node) => {
                if (node) nodeRefs.current.set(player.id, node);
                else nodeRefs.current.delete(player.id);
              }}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition-[opacity,transform] duration-500 ease-out will-change-transform",
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
                <button
                  type="button"
                  onClick={() => setExpandedTeam(player.teamName)}
                  className="truncate text-left text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                >
                  {player.teamName}
                  {player.combo >= 2 ? ` · ${player.combo}連続` : ""}
                </button>
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

      {canAdvance ? (
        <button
          type="button"
          onClick={onAdvance}
          className="event-cta mt-8 w-full rounded-full py-4 text-lg font-bold"
        >
          {isLast ? "結果を見る" : "次の問題へ"}
        </button>
      ) : (
        <p className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          ルームマスターが{isLast ? "結果発表" : "次の問題"}に進めるのを待っています
        </p>
      )}

      {expandedTeam ? (
        <TeamRosterModal
          teamName={expandedTeam}
          members={snapshot.filter((player) => player.teamName === expandedTeam)}
          onClose={() => setExpandedTeam(null)}
        />
      ) : null}
    </div>
  );
}

/** Any team's name is tappable by anyone — matches this room's existing full cross-team visibility (e.g. LiveBoard). */
function TeamRosterModal({
  teamName,
  members,
  onClose,
}: {
  teamName: string;
  members: RankedPlayer[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-roster-title"
      onClick={onClose}
    >
      <div
        className="event-card w-full max-w-md rounded-[1.4rem] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-en">Team</p>
            <h2 id="team-roster-title" className="mt-1 text-lg font-black tracking-tight">
              {teamName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-y-auto">
          <ul className="flex flex-col gap-3">
            {members.map((member) => (
              <li key={member.id} className="rounded-xl bg-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold">
                    <PlayerAvatar
                      outfit={member.outfit}
                      name={member.name}
                      size="sm"
                      className="size-6 ring-1"
                    />
                    <span className="truncate">{member.name}</span>
                  </p>
                  <span className="shrink-0 text-sm font-black tabular-nums">
                    {member.xp} XP
                  </span>
                </div>
                {member.answers.length > 0 ? (
                  <div className="mt-2 -mx-1 overflow-x-auto px-1">
                    <div className="flex gap-1.5">
                      {member.answers.map((answer, index) => (
                        <span
                          key={index}
                          className={cn(
                            "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold",
                            answer.correct
                              ? "bg-correct-surface text-accent"
                              : "bg-wrong-surface text-wrong",
                          )}
                        >
                          問{index + 1}
                          {answer.correct ? (
                            <Check className="size-3" strokeWidth={3} />
                          ) : (
                            <X className="size-3" strokeWidth={3} />
                          )}
                          {answer.correct ? `+${answer.xp}` : null}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">まだ回答がありません</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AnswerBox({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "neutral" | "accent";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        tone === "accent"
          ? "border-accent/30 bg-accent-soft"
          : "border-border bg-surface-elevated",
      )}
    >
      <p
        className={cn(
          "text-xs font-extrabold",
          tone === "accent" ? "text-accent" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

/**
 * A blank-fill template rendered as sentence text with each blank's value as
 * its own inline word — an empty blank is a clearly marked "missing" chip
 * instead of blending into the surrounding line as plain text.
 */
function FilledTemplateText({ fill }: { fill: TemplateFill }) {
  return (
    <p className="leading-loose">
      {fill.parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < fill.values.length ? (
            <span
              className={cn(
                "mx-1 inline-block rounded-md px-1.5 py-0.5 align-middle font-mono text-xs font-bold",
                fill.values[index] == null
                  ? "bg-wrong-surface text-wrong"
                  : "bg-muted text-foreground",
              )}
            >
              {fill.values[index] ?? "空欄"}
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function RecapCard({ recap }: { recap: StandingsRecap }) {
  const correct = recap.result === "correct";
  return (
    <div
      className={cn(
        "mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3.5",
        correct
          ? "border-correct/30 bg-correct-surface text-accent"
          : "border-wrong/30 bg-wrong-surface text-wrong",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          correct ? "bg-accent text-white" : "bg-wrong text-white",
        )}
      >
        {correct ? (
          <Check className="size-5" strokeWidth={3} />
        ) : (
          <X className="size-5" strokeWidth={3} />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-base font-extrabold leading-snug">{recap.title}</p>
        {correct && recap.gain ? (
          <p className="mt-1 text-sm font-bold">
            +{recap.gain.xp} XP
            {recap.gain.bonus > 0 ? `（速さボーナス +${recap.gain.bonus}）` : ""}
          </p>
        ) : null}
        {recap.yourAnswer != null ||
        recap.correctAnswer != null ||
        recap.yourAnswerFill ||
        recap.correctAnswerFill ? (
          <div className="mt-2 flex flex-col gap-2">
            {recap.yourAnswer != null ? (
              <AnswerBox label="あなたの回答" tone="neutral">
                {recap.yourAnswer}
              </AnswerBox>
            ) : recap.yourAnswerFill ? (
              <AnswerBox label="あなたの回答" tone="neutral">
                <FilledTemplateText fill={recap.yourAnswerFill} />
              </AnswerBox>
            ) : null}
            {recap.correctAnswer != null ? (
              <AnswerBox label="正解" tone="accent">
                {recap.correctAnswer}
              </AnswerBox>
            ) : recap.correctAnswerFill ? (
              <AnswerBox label="正解" tone="accent">
                <FilledTemplateText fill={recap.correctAnswerFill} />
              </AnswerBox>
            ) : null}
          </div>
        ) : null}
        <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
          <span className="font-extrabold">解説: </span>
          {recap.explanation}
        </p>
        {recap.codeDiff ? (
          <>
            <p className="mt-2 text-xs font-extrabold text-muted-foreground">
              あなたのコード（
              <span className="text-wrong">赤=直っていない</span>
              ・
              <span className="text-accent">緑=正しく直せた</span>
              ）
            </p>
            <CodeDiffView diff={recap.codeDiff} />
          </>
        ) : null}
        {recap.yourCode ? (
          <>
            <p className="mt-2 text-xs font-extrabold text-muted-foreground">あなたの回答</p>
            <CodeExampleView code={recap.yourCode} />
          </>
        ) : null}
        {recap.solution ? (
          <>
            <p className="mt-2 text-xs font-extrabold text-accent">模範解答</p>
            <CodeExampleView code={recap.solution} />
          </>
        ) : null}
        {recap.codeExample ? (
          <>
            <p className="mt-2 text-xs font-extrabold text-accent">解答例</p>
            <CodeExampleView code={recap.codeExample} />
          </>
        ) : null}
      </div>
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
