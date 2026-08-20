"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MascotCharacter } from "@/components/home/mascot-character";
import { LessonCard } from "@/components/home/lesson-card";
import { ProgressPanel } from "@/components/home/progress-panel";
import { getCompletedLessons, getLearnerProgress, lessons } from "@/lib/lessons";
import { ArrowRight } from "lucide-react";

export function HomeScreen() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(getCompletedLessons());

    function sync() {
      setCompleted(getCompletedLessons());
    }

    window.addEventListener("storage", sync);
    window.addEventListener("lesson-complete", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("lesson-complete", sync);
    };
  }, []);

  const learner = getLearnerProgress(completed);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-10 px-5 pb-40 pt-10">
      <header className="min-w-0">
        <p className="brand-mark text-[2rem] sm:text-[2.2rem]">POSSE</p>
        <span className="rule-line mt-3" />
        <p className="section-en mt-8">Learning</p>
        <h1 className="mt-2 text-[1.85rem] font-black leading-snug tracking-tight">
          プログラミング学習を
          <br />
          コミュニティの力で。
        </h1>
      </header>

      <section className="relative z-10 flex justify-center">
        <MascotCharacter />
      </section>

      <ProgressPanel completedIds={completed} />

      <section>
        <p className="section-en">Event</p>
        <h2 className="mb-4 mt-1 text-[1.45rem] font-black tracking-tight">
          イベント
        </h2>
        <Link href="/next-server-day" className="block">
          <div className="event-card relative overflow-hidden rounded-2xl p-6">
            <span className="event-glow" aria-hidden />
            <p className="section-en">Next Server Day</p>
            <p className="brand-mark mt-2 text-[1.45rem] leading-snug">
              次サバDAY 限定クイズ
            </p>
            <span className="rule-line mt-3" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              チームでつながって、連続正解を競おう。
            </p>
            <span className="event-cta mt-5 inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold">
              挑戦する
              <ArrowRight className="size-4" />
            </span>
          </div>
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="section-en">Lessons</p>
            <h2 className="mt-1 text-[1.45rem] font-black tracking-tight">
              レッスン
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {learner.completed}/{learner.total} 完了 · Lv.{learner.level}
            </p>
          </div>
          <Link
            href="/video"
            className="text-sm font-semibold text-accent"
          >
            すべて見る
          </Link>
        </div>
        <div className="space-y-4">
          {lessons.slice(0, 3).map((lesson, index) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              index={index}
              completed={completed.includes(lesson.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
