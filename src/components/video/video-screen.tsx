"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getCompletedLessons,
  getLesson,
  isLessonComplete,
  isLessonPhase,
  lessonPhases,
  lessonsInPhase,
  markLessonComplete,
  phaseLabel,
  weekLabel,
  weeksInPhase,
  type Lesson,
  type LessonPhase,
} from "@/lib/lessons";
import { useLessons } from "@/lib/use-lessons";
import { LessonCard } from "@/components/home/lesson-card";
import { LessonEditor } from "@/components/video/lesson-editor";
import { ArrowLeft, CheckCircle2, PencilLine, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function useCompleted() {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    function sync() {
      setCompleted(getCompletedLessons());
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("lesson-complete", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("lesson-complete", sync);
    };
  }, []);

  return completed;
}

function VideoCatalog({
  lessons,
  canEdit,
  onChanged,
}: {
  lessons: Lesson[];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const completed = useCompleted();
  const [editing, setEditing] = useState(false);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-8">
      <p className="section-en">Videos</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">講義動画</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        フェーズを選んでください。動画を視聴完了すると、そのレッスンのクイズが開きます。
      </p>

      {canEdit ? (
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
        >
          <PencilLine className="size-4" />
          {editing ? "編集を閉じる" : "動画を編集"}
        </button>
      ) : null}

      {canEdit && editing ? (
        <LessonEditor lessons={lessons} onChanged={onChanged} />
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3">
        {lessonPhases.map((phase) => {
          const items = lessonsInPhase(lessons, phase);
          const done = items.filter((lesson) => completed.includes(lesson.id)).length;
          return (
            <Link
              key={phase}
              href={`/video?phase=${phase}`}
              className="glass-card flex flex-col items-start gap-3 rounded-[1.4rem] p-5 transition-transform hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-accent px-3 py-1 text-base font-black text-white">
                {phaseLabel(phase)}
              </span>
              <p className="text-sm font-bold text-muted-foreground">
                {items.length === 0 ? "準備中" : `${done}/${items.length} 本視聴済み`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PhaseLessons({ phase, lessons }: { phase: LessonPhase; lessons: Lesson[] }) {
  const completed = useCompleted();
  const weeks = weeksInPhase(lessons, phase);

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-6">
      <Link
        href="/video"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        フェーズ一覧に戻る
      </Link>

      <p className="section-en">Videos</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">
        {phaseLabel(phase)} の講義動画
      </h1>

      {weeks.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          このフェーズの動画はまだありません。
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {weeks.map(({ week, lessons: items }) => (
            <section key={week}>
              <h2 className="mb-3 text-sm font-bold text-muted-foreground">
                {weekLabel(week)}
              </h2>
              <div className="space-y-4">
                {items.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={lessons.findIndex((item) => item.id === lesson.id)}
                    completed={completed.includes(lesson.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function OtherLessonRow({
  lesson,
  active,
  done,
}: {
  lesson: Lesson;
  active: boolean;
  done: boolean;
}) {
  return (
    <Link
      href={`/video?lesson=${lesson.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-3",
        active
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface-elevated",
      )}
    >
      <PlayCircle
        className={cn(
          "size-5 shrink-0",
          active ? "text-accent" : "text-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
      </div>
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-accent" />
      ) : null}
    </Link>
  );
}

function VideoPlayer({ lesson, lessons }: { lesson: Lesson; lessons: Lesson[] }) {
  const completedIds = useCompleted();
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
        href={`/video?phase=${lesson.phase}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {phaseLabel(lesson.phase)} の一覧に戻る
      </Link>

      <p className="section-en">
        {phaseLabel(lesson.phase)} · {weekLabel(lesson.week)}
      </p>
      <h1 className="mt-1 text-xl font-black tracking-tight text-foreground">
        {lesson.title}
      </h1>
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

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">
          {phaseLabel(lesson.phase)} のほかの講義動画
        </h2>
        <div className="space-y-2">
          {lessonsInPhase(lessons, lesson.phase).map((item) => (
            <OtherLessonRow
              key={item.id}
              lesson={item}
              active={item.id === lesson.id}
              done={completedIds.includes(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function VideoContent() {
  const searchParams = useSearchParams();
  const { lessons, canEdit, refresh } = useLessons();
  const lesson = getLesson(lessons, searchParams.get("lesson"));
  const phase = Number(searchParams.get("phase"));
  if (!lesson && isLessonPhase(phase)) {
    return <PhaseLessons phase={phase} lessons={lessons} />;
  }
  if (!lesson) {
    return (
      <VideoCatalog lessons={lessons} canEdit={canEdit} onChanged={() => void refresh()} />
    );
  }
  return <VideoPlayer lesson={lesson} lessons={lessons} />;
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
