"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/lessons";
import { Lock, PlayCircle, Zap } from "lucide-react";

type LessonCardProps = {
  lesson: Lesson;
  index: number;
  completed: boolean;
};

export function LessonCard({ lesson, index, completed }: LessonCardProps) {
  return (
    <article className="event-card overflow-visible rounded-2xl">
      <div className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
            completed ? "bg-accent text-white" : "bg-muted text-muted-foreground",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{lesson.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {lesson.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{lesson.duration}</p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border p-4 pb-5">
        <Link
          href={`/video?lesson=${lesson.id}`}
          className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-accent px-3 py-3 text-sm font-semibold text-white shadow-[0_4px_0_#1e7ae6] sm:gap-2 sm:px-4"
        >
          <PlayCircle className="size-4" />
          講義動画
        </Link>

        {completed ? (
          <Link
            href={`/quiz?lesson=${lesson.id}`}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-3 py-3 text-sm font-semibold text-accent sm:gap-2 sm:px-4"
          >
            <Zap className="size-4" />
            クイズ
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 cursor-not-allowed items-center justify-center gap-1 rounded-full bg-muted px-3 py-3 text-sm font-semibold text-muted-foreground sm:gap-2 sm:px-4">
            <Lock className="size-4" />
            クイズ
          </span>
        )}
      </div>
    </article>
  );
}
