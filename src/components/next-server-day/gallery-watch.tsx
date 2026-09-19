import { QuestionBubble } from "@/components/question-bubble";
import { CodeExampleView } from "@/components/next-server-day/code-example-view";
import type { NextServerDayQuestion } from "@/lib/next-server-day";

function fillTemplatePlain(template: string, values: string[]): string {
  return template
    .split("___")
    .reduce((sentence, part, index) => sentence + part + (values[index] ?? ""), "");
}

/** The correct answer, in whatever shape fits the question kind — a spectator never submitted anything, so there's no "your answer" side to show. */
function correctAnswerText(question: NextServerDayQuestion): string | null {
  if (question.kind === "choice") return question.choices[question.answerIndex];
  if (question.kind === "order") return question.items.join(" → ");
  if (question.kind === "blank") {
    return fillTemplatePlain(
      question.template,
      question.accepted.map((list) => list[0] ?? ""),
    );
  }
  return null;
}

/**
 * A read-only view of the room's current question for gallery spectators —
 * the same prompt/code the answerers see, with no answer panel since they
 * can't answer. Once everyone active has answered, it also reveals the
 * correct answer, mirroring (in miniature) the recap the players themselves
 * get on the standings screen.
 */
export function GalleryWatch({
  question,
  questionNumber,
  total,
  allAnswered,
}: {
  question: NextServerDayQuestion;
  questionNumber: number;
  total: number;
  allAnswered: boolean;
}) {
  const answer = allAnswered ? correctAnswerText(question) : null;
  const code =
    allAnswered && (question.kind === "bugfix" || question.kind === "code")
      ? question.kind === "bugfix"
        ? question.solution
        : question.example
      : null;

  return (
    <section className="event-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="section-en">Now Watching</p>
        <p className="text-xs font-bold text-muted-foreground">
          {questionNumber} / {total}問
        </p>
      </div>
      <QuestionBubble prompt={question.prompt} code={question.code} />
      {allAnswered ? (
        <div className="mt-3 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2.5">
          <p className="text-xs font-extrabold text-accent">正解</p>
          {answer !== null ? (
            <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">
              {answer}
            </p>
          ) : null}
          {code !== null ? <CodeExampleView code={code} /> : null}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-muted-foreground">
          全員の回答を待っています…
        </p>
      )}
    </section>
  );
}
