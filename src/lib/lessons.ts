export type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
};

export const lessons: Lesson[] = [
  {
    id: "html-css",
    title: "HTML / CSS 基礎",
    description: "ページの骨格と見た目の整え方を学びます",
    duration: "約12分",
    videoUrl: "https://www.youtube.com/embed/qz0aGYrrlhU",
  },
  {
    id: "javascript",
    title: "JavaScript 入門",
    description: "変数・条件分岐・配列など、動きをつける基本です",
    duration: "約18分",
    videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
  },
  {
    id: "git",
    title: "Git & GitHub",
    description: "変更の記録と、チームでコードを共有する流れです",
    duration: "約15分",
    videoUrl: "https://www.youtube.com/embed/RGOj5yH7evk",
  },
];

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
