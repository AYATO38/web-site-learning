/**
 * Renders a code question's worked example — plain reference code, no
 * per-line coloring. Code questions can have more than one valid answer, so
 * this is shown as-is rather than diffed against what the student wrote.
 */
export function CodeExampleView({ code }: { code: string }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-surface-elevated">
      <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-foreground">
        {code}
      </pre>
    </div>
  );
}
