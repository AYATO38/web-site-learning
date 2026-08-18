export type Difficulty = "beginner" | "intermediate" | "advanced";

export type QuestionType =
  | "selection"
  | "sort"
  | "fill-in"
  | "writing"
  | "bug-fix";

export type NextServerDayQuestion = {
  id: string;
  difficulty: Difficulty;
  category: "HTML" | "CSS" | "JS";
  type: QuestionType;
  prompt: string;
  code?: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  xp: number;
};

export const DIFFICULTY_LABELS: Record<
  Difficulty,
  { label: string; desc: string; category: string }
> = {
  beginner: { label: "初級", desc: "HTML · 5問 · 各3分", category: "HTML" },
  intermediate: {
    label: "中級",
    desc: "CSS · 5問 · 各5分",
    category: "CSS",
  },
  advanced: { label: "上級", desc: "JS/React · 3問 · 各7分", category: "JS" },
};
