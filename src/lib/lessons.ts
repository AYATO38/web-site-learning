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
    description: "Webページの構造とスタイリングの基本を学びます",
    duration: "12 min",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "javascript",
    title: "JavaScript 入門",
    description: "変数・関数・条件分岐を使ったプログラミング",
    duration: "18 min",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: "git",
    title: "Git & GitHub",
    description: "バージョン管理とチーム開発の基本ワークフロー",
    duration: "15 min",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
