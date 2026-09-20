import { Loader2 } from "lucide-react";
import { QuestionBubble } from "@/components/question-bubble";
import { PlayerAvatar } from "@/components/next-server-day/player-avatar";
import {
  DIFFICULTY_LABELS,
  QUESTION_KIND_LABELS,
  type NextServerDayQuestion,
} from "@/lib/next-server-day";
import type { PendingPlayer } from "@/lib/nsd-room";

const MAX_SHOWN_PENDING = 8;

/**
 * A read-only view of the room's current question for gallery spectators —
 * the same prompt/code/info line the answerers see, with no answer panel
 * since they can't answer. Once everyone active has answered, the room
 * master's own StandingsReveal screen takes over instead (see page.tsx), so
 * this only ever needs to cover the "still answering" state.
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

  return (
    <section className="event-card rounded-2xl p-4">
      <p className="text-sm font-semibold text-muted-foreground">
        {DIFFICULTY_LABELS[question.difficulty].label} ·{" "}
        {QUESTION_KIND_LABELS[question.kind]} · もんだい {questionNumber} /{" "}
        {total}
      </p>
      <QuestionBubble prompt={question.prompt} code={question.code} />
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
