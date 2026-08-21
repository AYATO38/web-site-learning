import type {
  NextServerDayQuestion,
  QuestionKind,
} from "@/lib/next-server-day";

export type AnswerDraft =
  | { kind: "choice"; index: number | null }
  | { kind: "text"; value: string }
  | { kind: "order"; items: string[] };

export function shuffleItems<T>(items: T[]): T[] {
  const next = [...items];
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (
      next.length < 2 ||
      next.some((item, index) => item !== items[index])
    ) {
      return next;
    }
  }
  if (next.length >= 2) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  return next;
}

export function initialDraft(question: NextServerDayQuestion): AnswerDraft {
  if (question.kind === "choice") {
    return { kind: "choice", index: null };
  }
  if (question.kind === "order") {
    return { kind: "order", items: shuffleItems(question.items) };
  }
  const starter =
    question.kind === "bugfix"
      ? question.starter
      : question.kind === "code"
        ? (question.starter ?? "")
        : "";
  return { kind: "text", value: starter };
}

export function canSubmitDraft(
  question: NextServerDayQuestion,
  draft: AnswerDraft,
): boolean {
  if (question.kind === "choice") {
    return draft.kind === "choice" && draft.index !== null;
  }
  if (question.kind === "order") {
    return draft.kind === "order" && draft.items.length > 0;
  }
  return draft.kind === "text" && draft.value.trim().length > 0;
}

export function normalizeCode(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*,\s*/g, ",")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+>/g, ">")
    .replace(/\/\s*>/g, ">")
    .replace(/<(\/?)([^>\s]+)/g, (_, slash: string, tag: string) =>
      `<${slash}${tag.toLowerCase()}`,
    )
    .trim()
    .toLowerCase();
}

function normalizeBlank(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
}

function includesNormalized(haystack: string, needle: string): boolean {
  return normalizeCode(haystack).includes(normalizeCode(needle));
}

function includesInOrder(haystack: string, needles: string[]): boolean {
  const normalized = normalizeCode(haystack);
  let from = 0;
  for (const needle of needles) {
    const token = normalizeCode(needle);
    const index = normalized.indexOf(token, from);
    if (index < 0) return false;
    from = index + token.length;
  }
  return true;
}

function gradeWritten(
  value: string,
  rules: {
    accepted?: string[];
    mustInclude?: string[];
    mustIncludeOrdered?: string[];
    mustNotInclude?: string[];
    tests?: { call: string; expected: unknown }[];
  },
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (rules.tests && rules.tests.length > 0) {
    try {
      const runner = new Function(
        `"use strict";\n${trimmed}\n; return [${rules.tests.map((test) => test.call).join(",")}];`,
      );
      const results = runner() as unknown[];
      if (
        !rules.tests.every((test, index) =>
          Object.is(results[index], test.expected),
        )
      ) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (rules.accepted && rules.accepted.length > 0) {
    const got = normalizeCode(trimmed);
    if (rules.accepted.some((item) => normalizeCode(item) === got)) {
      return true;
    }
    if (!rules.mustInclude?.length && !rules.mustIncludeOrdered?.length && !rules.tests?.length) {
      return false;
    }
  }

  if (rules.mustInclude?.some((item) => !includesNormalized(trimmed, item))) {
    return false;
  }
  if (rules.mustIncludeOrdered && !includesInOrder(trimmed, rules.mustIncludeOrdered)) {
    return false;
  }
  if (rules.mustNotInclude?.some((item) => includesNormalized(trimmed, item))) {
    return false;
  }

  return Boolean(
    rules.tests?.length ||
      rules.mustInclude?.length ||
      rules.mustIncludeOrdered?.length ||
      rules.accepted?.length,
  );
}

export function gradeAnswer(
  question: NextServerDayQuestion,
  draft: AnswerDraft,
): boolean {
  if (question.kind === "choice") {
    return draft.kind === "choice" && draft.index === question.answerIndex;
  }
  if (question.kind === "order") {
    return (
      draft.kind === "order" &&
      draft.items.length === question.items.length &&
      draft.items.every((item, index) => item === question.items[index])
    );
  }
  if (draft.kind !== "text") return false;
  if (question.kind === "blank") {
    const got = normalizeBlank(draft.value);
    return question.accepted.some((item) => normalizeBlank(item) === got);
  }
  return gradeWritten(draft.value, question);
}

export function kindNeedsLongerTime(kind: QuestionKind): boolean {
  return kind === "code" || kind === "bugfix";
}

export function questionTimeLimit(
  kind: QuestionKind,
  roomLimit: number | null | undefined,
): number | null {
  if (!roomLimit) return null;
  return kindNeedsLongerTime(kind) ? Math.max(roomLimit, 60) : roomLimit;
}

export function speedWindowSeconds(
  kind: QuestionKind,
  timeLimitSeconds: number | null | undefined,
): number {
  return timeLimitSeconds ?? (kindNeedsLongerTime(kind) ? 60 : 15);
}

export function earnedXp({
  baseXp,
  elapsedMs,
  windowSeconds,
}: {
  baseXp: number;
  elapsedMs: number;
  windowSeconds: number;
}): { xp: number; bonus: number } {
  const remainingRatio = Math.max(
    0,
    Math.min(1, 1 - Math.max(0, elapsedMs) / (windowSeconds * 1000)),
  );
  const xp = Math.max(1, Math.round(baseXp * (1 + remainingRatio)));
  return { xp, bonus: xp - baseXp };
}
