import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function QuizTimer({
  total,
  remaining,
}: {
  total: number;
  remaining: number;
}) {
  const urgent = remaining <= 5;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2",
        urgent
          ? "border-wrong/40 bg-wrong-surface text-wrong"
          : "border-border bg-muted text-foreground",
      )}
      role="timer"
      aria-live="polite"
      aria-label={`残り ${remaining} 秒`}
    >
      <Clock className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold">残り時間</span>
          <span className="text-lg font-black tabular-nums leading-none">
            {remaining}
            <span className="ml-0.5 text-xs font-bold">秒</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-100 ease-linear",
              urgent ? "bg-wrong" : "bg-accent",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
