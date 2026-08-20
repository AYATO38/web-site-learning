"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Quiz } from "@/components/quiz";
import { isLessonComplete, lessons } from "@/lib/lessons";
import { getQuestionsForLesson } from "@/lib/questions";
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
      <div className="quiz-play relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <span className="event-glow pointer-events-none" aria-hidden />
        <div className="event-card relative z-10 w-full max-w-sm rounded-2xl p-6">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="size-7" />
          </span>
          <p className="section-en mt-4">Quiz</p>
          <h1 className="mt-1 text-xl font-black tracking-tight text-foreground">
            クイズはロック中
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            「{lesson.title}」の講義動画を視聴完了すると解放されます。
          </p>
          <Link
            href={`/video?lesson=${lesson.id}`}
            className="event-cta mt-5 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
          >
            講義動画を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Quiz
      lessonTitle={lesson.title}
      questions={getQuestionsForLesson(lesson.id)}
    />
  );
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
