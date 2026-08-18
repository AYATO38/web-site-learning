"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MascotCharacter } from "@/components/home/mascot-character";
import { LessonCard } from "@/components/home/lesson-card";
import { getCompletedLessons, lessons } from "@/lib/lessons";
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-36 pt-10">
      <header className="mb-8">
        <p className="text-[1.65rem] font-black tracking-tight">POSSE</p>
        <p className="section-en mt-8">Learning</p>
        <h1 className="mt-1 text-[1.9rem] font-bold leading-snug tracking-tight">
          プログラミング学習を
          <br />
          コミュニティの力で。
        </h1>
      </header>

      <section className="mb-12 flex justify-center">
        <MascotCharacter />
      </section>

      <section>
        <p className="section-en">Event</p>
        <h2 className="mb-4 mt-1 text-[1.35rem] font-bold">イベント</h2>
        <Link href="/next-server-day" className="block">
          <div className="event-theme relative overflow-hidden rounded-2xl p-5 text-foreground">
            <div className="event-bg absolute inset-0" />
            <div className="relative">
              <span className="absolute right-1 top-1 size-2 rounded-full bg-accent shadow-[0_0_14px_#3b9eff]" />
              <p className="section-en">Next Server Day</p>
              <p className="mt-1 text-xl font-bold">次サバDAY 限定クイズ</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                チーム対抗で、連続正解を競おう。
              </p>
              <span className="mt-5 inline-flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white">
                挑戦する
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      <section className="mt-12">
        <p className="section-en">Lessons</p>
        <h2 className="mb-4 mt-1 text-[1.35rem] font-bold">レッスン</h2>
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
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
