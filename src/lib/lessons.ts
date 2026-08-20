export type LessonCategory = "基礎" | "見た目" | "動き" | "チーム開発";

export type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  category: LessonCategory;
};

export const lessonCategories: LessonCategory[] = [
  "基礎",
  "見た目",
  "動き",
  "チーム開発",
];

export const lessons: Lesson[] = [
  {
    id: "html-css",
    title: "HTML / CSS 基礎",
    description: "ページの骨格と、色や余白などの基本を学びます",
    duration: "約12分",
    videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU",
    category: "基礎",
  },
  {
    id: "web-basics",
    title: "インターネットのしくみ",
    description: "ブラウザがページを表示するまでの流れをつかみます",
    duration: "約5分",
    videoUrl: "https://www.youtube.com/embed/7_LPdttKXPc",
    category: "基礎",
  },
  {
    id: "css",
    title: "CSS 入門",
    description: "文字色・サイズ・余白など、見た目の指定を学びます",
    duration: "約80分",
    videoUrl: "https://www.youtube.com/embed/yfoY53QXEnI",
    category: "見た目",
  },
  {
    id: "flexbox",
    title: "Flexbox で並べる",
    description: "ボタンやカードを横並び・中央揃えにする方法です",
    duration: "約20分",
    videoUrl: "https://www.youtube.com/embed/JJSoEo8JSrs",
    category: "見た目",
  },
  {
    id: "javascript",
    title: "JavaScript 入門",
    description: "変数・条件分岐・配列など、動きをつける基本です",
    duration: "約18分",
    videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
    category: "動き",
  },
  {
    id: "react",
    title: "React 入門",
    description: "画面を部品に分けて、状態つきのUIを作ります",
    duration: "約90分",
    videoUrl: "https://www.youtube.com/embed/w7ejDZ8STwI",
    category: "動き",
  },
  {
    id: "git",
    title: "Git & GitHub",
    description: "変更の記録と、チームでコードを共有する流れです",
    duration: "約15分",
    videoUrl: "https://www.youtube.com/embed/RGOj5yH7evk",
    category: "チーム開発",
  },
  {
    id: "terminal",
    title: "ターミナル入門",
    description: "フォルダ移動やファイル操作など、黒い画面の基本です",
    duration: "約45分",
    videoUrl: "https://www.youtube.com/embed/uwAqEzhyjtw",
    category: "チーム開発",
  },
];

export function getLesson(id: string | null | undefined): Lesson | undefined {
  if (!id) return undefined;
  return lessons.find((lesson) => lesson.id === id);
}

export function lessonsInCategory(category: LessonCategory): Lesson[] {
  return lessons.filter((lesson) => lesson.category === category);
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
    name: LessonCategory;
    completed: number;
    total: number;
  }[];
};

export function getLearnerProgress(completedIds: string[]): LearnerProgress {
  const valid = new Set(lessons.map((lesson) => lesson.id));
  const completed = completedIds.filter((id) => valid.has(id)).length;
  const total = lessons.length;
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
    categories: lessonCategories.map((name) => {
      const items = lessonsInCategory(name);
      return {
        name,
        completed: items.filter((lesson) => completedIds.includes(lesson.id))
          .length,
        total: items.length,
      };
    }),
  };
}
