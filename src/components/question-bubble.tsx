import { Sparkles } from "lucide-react";

export function QuestionBubble({
  prompt,
  code,
}: {
  prompt: string;
  code?: string;
}) {
  return (
    <div className="event-card relative mt-4 overflow-hidden rounded-2xl p-5">
      <span className="event-glow" aria-hidden />
      <div className="relative flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="section-en">Question</p>
          <p className="mt-1 text-lg font-black leading-snug tracking-tight text-balance sm:text-xl">
            {prompt}
          </p>
        </div>
      </div>
      {code ? (
        <pre className="relative mt-4 overflow-x-auto rounded-xl border border-border bg-muted px-4 py-3 font-mono text-sm font-semibold text-foreground">
          <code>{code}</code>
        </pre>
      ) : null}
    </div>
  );
}
