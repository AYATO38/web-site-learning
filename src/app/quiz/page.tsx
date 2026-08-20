"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Quiz } from "@/components/quiz";
import { isLessonComplete, lessons } from "@/lib/lessons";
import { Lock } from "lucide-react";

function QuizGate() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson") ?? lessons[0].id;
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnlocked(isLessonComplete(lesson.id));
    setReady(true);
  }, [lesson.id]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-8" />
        </span>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">
            クイズはロック中
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            「{lesson.title}」の講義動画を視聴完了すると解放されます。
          </p>
        </div>
        <Link
          href={`/video?lesson=${lesson.id}`}
          className="event-cta rounded-full px-6 py-3 text-sm font-semibold"
        >
          講義動画を見る
        </Link>
      </div>
    );
  }

  return <Quiz lessonTitle={lesson.title} />;
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          読み込み中...
        </div>
      }
    >
      <QuizGate />
    </Suspense>
  );
}
