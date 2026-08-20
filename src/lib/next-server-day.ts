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
