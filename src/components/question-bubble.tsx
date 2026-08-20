export function QuestionBubble({
  prompt,
  code,
}: {
  prompt: string;
  code?: string;
}) {
  return (
    <div className="mt-4 flex items-end gap-2">
      <span className="quiz-face mb-1 shrink-0" aria-hidden>
        😊
      </span>
      <div className="quiz-bubble min-w-0 flex-1">
        <p className="quiz-bubble-text text-lg font-black leading-snug text-balance sm:text-2xl">
          {prompt}
        </p>
        {code ? (
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-zinc-900 px-4 py-3 font-mono text-sm font-semibold text-white sm:text-base">
            <code>{code}</code>
          </pre>
        ) : null}
      </div>
    </div>
  );
}
