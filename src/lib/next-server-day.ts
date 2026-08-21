export type Difficulty = "beginner" | "intermediate" | "advanced";

export type QuestionKind = "choice" | "blank" | "order" | "bugfix" | "code";

type QuestionBase = {
  id: string;
  difficulty: Difficulty;
  category: "HTML" | "CSS" | "JS" | "React";
  kind: QuestionKind;
  prompt: string;
  explanation: string;
  xp: number;
};

export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  code?: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
};

export type BlankQuestion = QuestionBase & {
  kind: "blank";
  template: string;
  accepted: string[];
};

export type OrderQuestion = QuestionBase & {
  kind: "order";
  items: string[];
};

export type BugfixQuestion = QuestionBase & {
  kind: "bugfix";
  starter: string;
  language: "html" | "css" | "js";
  accepted?: string[];
  mustInclude?: string[];
  mustIncludeOrdered?: string[];
  mustNotInclude?: string[];
};

export type CodeQuestion = QuestionBase & {
  kind: "code";
  starter?: string;
  language: "html" | "css" | "js";
  accepted?: string[];
  mustInclude?: string[];
  mustIncludeOrdered?: string[];
  mustNotInclude?: string[];
  tests?: { call: string; expected: unknown }[];
};

export type NextServerDayQuestion =
  | ChoiceQuestion
  | BlankQuestion
  | OrderQuestion
  | BugfixQuestion
  | CodeQuestion;

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  choice: "選択",
  blank: "穴埋め",
  order: "並び替え",
  bugfix: "バグ修正",
  code: "コード記述",
};

export const DIFFICULTY_LABELS: Record<
  Difficulty,
  { label: string; desc: string; kinds: string }
> = {
  beginner: {
    label: "初級",
    desc: "HTML · 5問",
    kinds: "バグ修正・穴埋め・並び替え・コード・選択",
  },
  intermediate: {
    label: "中級",
    desc: "Tailwind CSS · 5問",
    kinds: "選択・並び替え・バグ修正・コード・穴埋め",
  },
  advanced: {
    label: "上級",
    desc: "JS / React · 3問",
    kinds: "選択・バグ修正・コード",
  },
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
