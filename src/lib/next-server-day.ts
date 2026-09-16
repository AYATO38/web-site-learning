export type Difficulty = "beginner" | "intermediate" | "advanced";

export type QuestionKind = "choice" | "blank" | "order" | "bugfix" | "code";

type QuestionBase = {
  id: string;
  difficulty: Difficulty;
  category: "HTML" | "CSS" | "JS" | "React";
  kind: QuestionKind;
  prompt: string;
  code?: string;
  explanation: string;
  xp: number;
};

export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
};

export type BlankQuestion = QuestionBase & {
  kind: "blank";
  template: string;
  accepted: string[][];
};

export type OrderQuestion = QuestionBase & {
  kind: "order";
  items: string[];
  acceptedOrders?: string[][];
};

export type BugfixQuestion = QuestionBase & {
  kind: "bugfix";
  starter: string;
  language: "html" | "css" | "js";
  accepted?: string[];
  mustInclude?: string[];
  mustIncludeClasses?: string[];
  mustIncludeOrdered?: string[];
  mustNotInclude?: string[];
};

export type CodeQuestion = QuestionBase & {
  kind: "code";
  starter?: string;
  language: "html" | "css" | "js";
  accepted?: string[];
  mustInclude?: string[];
  mustIncludeClasses?: string[];
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

/** A question as the store returns it: editable content plus its place in line. */
export type StoredQuestion = NextServerDayQuestion & {
  sortOrder: number;
  updatedAt: number;
};

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  choice: "選択",
  blank: "穴埋め",
  order: "並び替え",
  bugfix: "バグ修正",
  code: "コード記述",
};

/**
 * Just the topic tag per difficulty — the question count and which kinds
 * appear are computed from the actual (editable) question list instead of
 * being hand-maintained text here, so they can never drift out of date.
 */
export const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string }> = {
  beginner: { label: "初級", desc: "HTML" },
  intermediate: { label: "中級", desc: "Tailwind CSS" },
  advanced: { label: "上級", desc: "JS / React" },
};

/** Every question gets the same 3-minute clock — no per-room or per-kind exceptions. */
export const QUESTION_TIME_LIMIT_SECONDS = 180;
export const QUESTION_TIME_LIMIT_LABEL = "1問3分";
