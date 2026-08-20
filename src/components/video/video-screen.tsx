"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getCompletedLessons,
  isLessonComplete,
  lessons,
  markLessonComplete,
} from "@/lib/lessons";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function VideoContent() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson") ?? lessons[0].id;
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isLessonComplete(lesson.id));
  }, [lesson.id]);

  function handleComplete() {
    markLessonComplete(lesson.id);
    setCompleted(true);
    window.dispatchEvent(new Event("lesson-complete"));
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        ホームに戻る
      </Link>

      <h1 className="font-display text-xl font-medium text-foreground">{lesson.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>

      <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-border bg-foreground shadow-[0_18px_40px_rgba(23,23,23,0.08)]">
        <div className="relative aspect-video w-full">
          <iframe
            src={lesson.videoUrl}
            title={lesson.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface-elevated p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          動画を視聴したら「視聴完了」を押してください。クイズが解放されます。
        </p>
        <button
          type="button"
          onClick={handleComplete}
          disabled={completed}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
        >
          <CheckCircle2 className="size-4" />
          {completed ? "視聴完了済み" : "視聴完了"}
        </button>
      </div>

      {!completed && getCompletedLessons().length > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          完了後、ホーム画面からクイズに挑戦できます
        </p>
      )}
    </div>
  );
}

export function VideoScreen() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          読み込み中...
        </div>
      }
    >
      <VideoContent />
    </Suspense>
  );
}
