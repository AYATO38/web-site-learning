"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { QuestionBubble } from "@/components/question-bubble";
import { AnswerPanel } from "@/components/next-server-day/answer-panel";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import {
  DIFFICULTY_LABELS,
  QUESTION_KIND_LABELS,
  type NextServerDayQuestion,
} from "@/lib/next-server-day";
import { initialDraft } from "@/lib/nsd-grade";
import type { PendingPlayer } from "@/lib/nsd-room";

const MAX_SHOWN_PENDING = 8;
const NOOP = () => {};

/**
 * A read-only view of the room's current question for gallery spectators —
 * the same prompt/code/info line and choices/blanks/order/starter code the
 * answerers see (via AnswerPanel, locked — it already renders a disabled,
 * read-only view once phase isn't "answering"), just with no way to answer.
 * Once everyone active has answered, the room master's own StandingsReveal
 * screen takes over instead (see page.tsx), so this only ever needs to
 * cover the "still answering" state.
 */
export function GalleryWatch({
  question,
  questionNumber,
  total,
  pending,
}: {
  question: NextServerDayQuestion;
  questionNumber: number;
  total: number;
  pending: PendingPlayer[];
}) {
  const shown = pending.slice(0, MAX_SHOWN_PENDING);
  const extra = pending.length - shown.length;
  // A throwaway draft, just so AnswerPanel has something to render read-only
  // — memoized so an order question's shuffled item order doesn't re-roll on
  // every room poll.
  const draft = useMemo(() => initialDraft(question), [question]);

  return (
    <section className="event-card rounded-2xl p-4">
      <p className="text-sm font-semibold text-muted-foreground">
        {DIFFICULTY_LABELS[question.difficulty].label} ·{" "}
        {QUESTION_KIND_LABELS[question.kind]} · もんだい {questionNumber} /{" "}
        {total}
      </p>
      <QuestionBubble prompt={question.prompt} code={question.code} />
      <AnswerPanel
        question={question}
        draft={draft}
        phase="waiting"
        onChange={NOOP}
      />
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-muted px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-snug">
            回答を見守っています
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
      </div>
    </section>
  );
}
