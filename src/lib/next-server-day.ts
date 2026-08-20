export type Difficulty = "beginner" | "intermediate" | "advanced";

export type NextServerDayQuestion = {
  id: string;
  difficulty: Difficulty;
  category: "HTML" | "CSS" | "JS";
  prompt: string;
  code?: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  xp: number;
};

export const DIFFICULTY_LABELS: Record<
  Difficulty,
  { label: string; desc: string }
> = {
  beginner: { label: "初級", desc: "HTML · 3問" },
  intermediate: { label: "中級", desc: "CSS · 3問" },
  advanced: { label: "上級", desc: "JavaScript · 3問" },
};

export const TIME_LIMIT_OPTIONS = [
  { seconds: null, label: "なし" },
  { seconds: 10, label: "10秒" },
  { seconds: 15, label: "15秒" },
  { seconds: 20, label: "20秒" },
  { seconds: 30, label: "30秒" },
] as const;

export const TIME_LIMIT_SECONDS = [10, 15, 20, 30] as const;

export type TimeLimitSeconds = (typeof TIME_LIMIT_SECONDS)[number];

export function normalizeTimeLimit(value: unknown): number | null {
  return (TIME_LIMIT_SECONDS as readonly number[]).includes(value as number)
    ? (value as number)
    : null;
}

export function timeLimitLabel(seconds: number | null | undefined): string {
  return seconds ? `1問 ${seconds}秒` : "制限時間なし";
}
