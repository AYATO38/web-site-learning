import { getLearnerProgress } from "@/lib/lessons";
import { cn } from "@/lib/utils";

export function ProgressPanel({ completedIds }: { completedIds: string[] }) {
  const progress = getLearnerProgress(completedIds);

  return (
    <section className="event-card relative overflow-hidden rounded-2xl p-5">
      <span className="event-glow" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="section-en">Progress</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            学習レベル
          </p>
          <h2 className="mt-0.5 text-[1.45rem] font-black tracking-tight">
            Lv.{progress.level} {progress.title}
          </h2>
        </div>
        <div
          className="flex size-[4.25rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-accent text-white shadow-[0_4px_0_#1e7ae6]"
          aria-label={`レベル ${progress.level}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">
            Lv
          </span>
          <span className="text-2xl font-black leading-none tabular-nums">
            {progress.level}
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold">レッスン進捗</p>
          <p className="text-sm font-bold tabular-nums text-accent">
            {progress.completed} / {progress.total}
          </p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="レッスンの進捗"
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(progress.percent, progress.completed > 0 ? 8 : 0)}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {progress.nextLevel
            ? `あと ${progress.remainingToNext} 本で Lv.${progress.nextLevel} ${progress.nextTitle}`
            : "全レッスン完了。マスターです！"}
        </p>
      </div>

      <ul className="relative mt-4 grid grid-cols-2 gap-2">
        {progress.categories.map((category) => {
          const done = category.completed >= category.total && category.total > 0;
          return (
            <li
              key={category.name}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                done
                  ? "border-accent/40 bg-accent-soft"
                  : "border-border bg-surface",
              )}
            >
              <p className="text-[11px] font-bold text-muted-foreground">
                {category.name}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-black tabular-nums",
                  done ? "text-accent" : "text-foreground",
                )}
              >
                {category.completed}/{category.total}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
