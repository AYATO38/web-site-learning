import { cn } from "@/lib/utils";
import type { DiffLine } from "@/lib/nsd-code-diff";

/**
 * Renders a bugfix answer diffed against the model solution: green for
 * lines the student changed and got right, red for lines that are still
 * wrong or missing entirely. Lines that were never part of the bug (same in
 * the starter and the solution) render plainly, whatever the student did
 * with them.
 */
export function CodeDiffView({ diff }: { diff: DiffLine[] }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-surface-elevated">
      <pre className="whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed">
        {diff.map((line, index) => (
          <div
            key={index}
            className={cn(
              "rounded px-1",
              line.type === "fixed" && "bg-correct-surface text-accent",
              line.type === "wrong" && "bg-wrong-surface text-wrong",
              line.type === "missing" &&
                "border-l-2 border-wrong bg-wrong-surface/60 pl-1.5 text-wrong italic",
            )}
          >
            {line.type === "missing"
              ? `${line.text || "（この行）"} ← 違います`
              : line.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
