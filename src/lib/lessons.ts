/** The course runs in four phases (PH1〜PH4), each split into weeks. */
export const lessonPhases = [1, 2, 3, 4] as const;
export type LessonPhase = (typeof lessonPhases)[number];

/**
 * Each phase's week range. PH1 runs Week 00〜16; the other phases keep a
 * provisional 1〜20 until their real schedules are decided.
 */
const PHASE_WEEKS: Record<LessonPhase, { first: number; last: number }> = {
  1: { first: 0, last: 16 },
  2: { first: 1, last: 20 },
  3: { first: 1, last: 20 },
  4: { first: 1, last: 20 },
};

export function weeksOfPhase(phase: LessonPhase): number[] {
  const { first, last } = PHASE_WEEKS[phase];
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export function weekRangeLabel(phase: LessonPhase): string {
  const { first, last } = PHASE_WEEKS[phase];
  return `${weekLabel(first)}〜${weekLabel(last)}`;
}

export function isWeekInPhase(phase: LessonPhase, week: unknown): week is number {
  const { first, last } = PHASE_WEEKS[phase];
  return typeof week === "number" && Number.isInteger(week) && week >= first && week <= last;
}

/** Pulls a week into the phase's range, e.g. when a lesson moves to another phase. */
export function clampWeek(phase: LessonPhase, week: number): number {
  const { first, last } = PHASE_WEEKS[phase];
  return Math.min(Math.max(week, first), last);
}

export type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  phase: LessonPhase;
  week: number;
};

export function phaseLabel(phase: LessonPhase): string {
  return `PH${phase}`;
}

export function weekLabel(week: number): string {
  return `Week ${String(week).padStart(2, "0")}`;
}

export function isLessonPhase(value: unknown): value is LessonPhase {
  return lessonPhases.includes(value as LessonPhase);
}

/** Lessons saved before phases existed carried a category instead; it picks the phase. */
const LEGACY_CATEGORY_PHASE: Record<string, LessonPhase> = {
  基礎: 1,
  見た目: 2,
  動き: 3,
  チーム開発: 4,
};

type LegacyLesson = Omit<Lesson, "phase" | "week"> & {
  phase?: unknown;
  week?: unknown;
  category?: unknown;
};

/**
 * Fills in phase/week for lessons stored under the old category scheme: the
 * category picks the phase and the lesson's position within that phase picks
 * the week, so the existing order carries over. Lessons that already have
 * both pass through untouched.
 */
export function withPhaseAndWeek<T extends LegacyLesson>(
  list: T[],
): (Omit<T, "phase" | "week" | "category"> & Pick<Lesson, "phase" | "week">)[] {
  const seenPerPhase = new Map<LessonPhase, number>();
  return list.map((item) => {
    const { category, phase: rawPhase, week: rawWeek, ...rest } = item;
    const phase = isLessonPhase(rawPhase)
      ? rawPhase
      : (LEGACY_CATEGORY_PHASE[String(category)] ?? 1);
    const position = (seenPerPhase.get(phase) ?? 0) + 1;
    seenPerPhase.set(phase, position);
    const week = isWeekInPhase(phase, rawWeek) ? rawWeek : clampWeek(phase, position);
    return { ...rest, phase, week };
  });
}

/** The bundled starting list — seeds the database once, and shows instantly before the live list loads. */
export const defaultLessons: Lesson[] = [
  {
    id: "html-css",
    title: "HTML / CSS 基礎",
    description: "ページの骨格と、色や余白などの基本を学びます",
    duration: "約12分",
    videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU",
    phase: 1,
    week: 1,
  },
  {
    id: "web-basics",
    title: "インターネットのしくみ",
    description: "ブラウザがページを表示するまでの流れをつかみます",
    duration: "約5分",
    videoUrl: "https://www.youtube.com/embed/7_LPdttKXPc",
    phase: 1,
    week: 2,
  },
  {
    id: "css",
    title: "CSS 入門",
    description: "文字色・サイズ・余白など、見た目の指定を学びます",
    duration: "約80分",
    videoUrl: "https://www.youtube.com/embed/yfoY53QXEnI",
    phase: 2,
    week: 1,
  },
  {
    id: "flexbox",
    title: "Flexbox で並べる",
    description: "ボタンやカードを横並び・中央揃えにする方法です",
    duration: "約20分",
    videoUrl: "https://www.youtube.com/embed/JJSoEo8JSrs",
    phase: 2,
    week: 2,
  },
  {
    id: "javascript",
    title: "JavaScript 入門",
    description: "変数・条件分岐・配列など、動きをつける基本です",
    duration: "約18分",
    videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
    phase: 3,
    week: 1,
  },
  {
    id: "react",
    title: "React 入門",
    description: "画面を部品に分けて、状態つきのUIを作ります",
    duration: "約90分",
    videoUrl: "https://www.youtube.com/embed/w7ejDZ8STwI",
    phase: 3,
    week: 2,
  },
  {
    id: "git",
    title: "Git & GitHub",
    description: "変更の記録と、チームでコードを共有する流れです",
    duration: "約15分",
    videoUrl: "https://www.youtube.com/embed/RGOj5yH7evk",
    phase: 4,
    week: 1,
  },
  {
    id: "terminal",
    title: "ターミナル入門",
    description: "フォルダ移動やファイル操作など、黒い画面の基本です",
    duration: "約45分",
    videoUrl: "https://www.youtube.com/embed/uwAqEzhyjtw",
    phase: 4,
    week: 2,
  },
];

export function getLesson(
  list: Lesson[],
  id: string | null | undefined,
): Lesson | undefined {
  if (!id) return undefined;
  return list.find((lesson) => lesson.id === id);
}

export function lessonsInPhase(list: Lesson[], phase: LessonPhase): Lesson[] {
  return list.filter((lesson) => lesson.phase === phase);
}

/** A phase's lessons grouped by week, weeks ascending, list order kept within each week. */
export function weeksInPhase(
  list: Lesson[],
  phase: LessonPhase,
): { week: number; lessons: Lesson[] }[] {
  const byWeek = new Map<number, Lesson[]>();
  for (const lesson of lessonsInPhase(list, phase)) {
    byWeek.set(lesson.week, [...(byWeek.get(lesson.week) ?? []), lesson]);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, lessons]) => ({ week, lessons }));
}

const STORAGE_KEY = "posse-lesson-progress";

export function getCompletedLessons(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markLessonComplete(lessonId: string): void {
  const completed = getCompletedLessons();
  if (!completed.includes(lessonId)) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...completed, lessonId]),
    );
  }
}

export function unmarkLessonComplete(lessonId: string): void {
  const completed = getCompletedLessons();
  if (completed.includes(lessonId)) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(completed.filter((id) => id !== lessonId)),
    );
  }
}

export function isLessonComplete(lessonId: string): boolean {
  return getCompletedLessons().includes(lessonId);
}

export const learnerRanks = [
  { level: 1, title: "ビギナー", minCompleted: 0 },
  { level: 2, title: "見習い", minCompleted: 1 },
  { level: 3, title: "一人前", minCompleted: 3 },
  { level: 4, title: "チャレンジャー", minCompleted: 5 },
  { level: 5, title: "マスター", minCompleted: 7 },
] as const;

export type LearnerProgress = {
  level: number;
  title: string;
  completed: number;
  total: number;
  percent: number;
  nextLevel: number | null;
  nextTitle: string | null;
  remainingToNext: number;
  categories: {
    name: string;
    completed: number;
    total: number;
  }[];
};

export function getLearnerProgress(
  completedIds: string[],
  list: Lesson[],
): LearnerProgress {
  const valid = new Set(list.map((lesson) => lesson.id));
  const completed = completedIds.filter((id) => valid.has(id)).length;
  const total = list.length;
  const rank =
    [...learnerRanks].reverse().find((item) => completed >= item.minCompleted) ??
    learnerRanks[0];
  const next = learnerRanks.find((item) => item.level === rank.level + 1);

  return {
    level: rank.level,
    title: rank.title,
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    nextLevel: next?.level ?? null,
    nextTitle: next?.title ?? null,
    remainingToNext: next
      ? Math.max(next.minCompleted - completed, 0)
      : 0,
    categories: lessonPhases.map((phase) => {
      const items = lessonsInPhase(list, phase);
      return {
        name: phaseLabel(phase),
        completed: items.filter((lesson) => completedIds.includes(lesson.id))
          .length,
        total: items.length,
      };
    }),
  };
}
