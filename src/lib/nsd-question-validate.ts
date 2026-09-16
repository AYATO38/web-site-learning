import type {
  BlankQuestion,
  BugfixQuestion,
  ChoiceQuestion,
  CodeQuestion,
  Difficulty,
  NextServerDayQuestion,
  OrderQuestion,
  QuestionKind,
} from "@/lib/next-server-day";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const CATEGORIES = ["HTML", "CSS", "JS", "React"] as const;
const LANGUAGES = ["html", "css", "js"] as const;
export const QUESTION_KINDS: QuestionKind[] = [
  "choice",
  "blank",
  "order",
  "bugfix",
  "code",
];

export type ValidationResult =
  | { ok: true; question: NextServerDayQuestion }
  | { ok: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

/**
 * Checks a parsed JSON value against the NextServerDayQuestion shape,
 * returning a specific Japanese error message for the first thing that's
 * wrong. Shared by the admin editor's live preview (client-side, as you type)
 * and the write API (server-side, the actual gate) so both agree on what's
 * valid.
 */
export function validateQuestionInput(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "JSONオブジェクト（{ ... }）を入力してください" };
  }
  const data = raw as Record<string, unknown>;

  if (!isNonEmptyString(data.id)) {
    return { ok: false, error: "id は空でない文字列にしてください" };
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(data.id)) {
    return {
      ok: false,
      error: "id は半角小文字・数字・ハイフンのみ使えます（例: html-bugfix-2）",
    };
  }
  if (!DIFFICULTIES.includes(data.difficulty as Difficulty)) {
    return {
      ok: false,
      error: "difficulty は beginner / intermediate / advanced のいずれかにしてください",
    };
  }
  if (!CATEGORIES.includes(data.category as (typeof CATEGORIES)[number])) {
    return { ok: false, error: "category は HTML / CSS / JS / React のいずれかにしてください" };
  }
  if (!isNonEmptyString(data.prompt)) {
    return { ok: false, error: "prompt（問題文）を入力してください" };
  }
  if (!isNonEmptyString(data.explanation)) {
    return { ok: false, error: "explanation（解説）を入力してください" };
  }
  if (typeof data.xp !== "number" || !Number.isFinite(data.xp) || data.xp <= 0) {
    return { ok: false, error: "xp は0より大きい数値にしてください" };
  }
  if (data.code !== undefined && typeof data.code !== "string") {
    return { ok: false, error: "code は文字列にしてください（不要なら省略）" };
  }

  const base = omitUndefined({
    id: data.id,
    difficulty: data.difficulty as Difficulty,
    category: data.category as ChoiceQuestion["category"],
    prompt: data.prompt as string,
    explanation: data.explanation as string,
    xp: data.xp as number,
    code: data.code as string | undefined,
  });

  if (data.kind === "choice") {
    if (
      !Array.isArray(data.choices) ||
      data.choices.length !== 4 ||
      !data.choices.every(isNonEmptyString)
    ) {
      return { ok: false, error: "choices は空でない文字列を4つ、配列で入れてください" };
    }
    if (
      typeof data.answerIndex !== "number" ||
      ![0, 1, 2, 3].includes(data.answerIndex)
    ) {
      return {
        ok: false,
        error: "answerIndex は 0〜3 の数値にしてください（choices の何番目が正解かを0始まりで）",
      };
    }
    const question: ChoiceQuestion = {
      ...base,
      kind: "choice",
      choices: data.choices as [string, string, string, string],
      answerIndex: data.answerIndex as 0 | 1 | 2 | 3,
    };
    return { ok: true, question };
  }

  if (data.kind === "blank") {
    if (!isNonEmptyString(data.template) || !data.template.includes("___")) {
      return { ok: false, error: "template に空欄を表す ___ を1つ以上入れてください" };
    }
    const blanks = (data.template.match(/___/g) ?? []).length;
    if (
      !Array.isArray(data.accepted) ||
      data.accepted.length !== blanks ||
      !data.accepted.every(isStringArray)
    ) {
      return {
        ok: false,
        error: `accepted は空欄の数（${blanks}個）ぶんの配列にしてください（各要素は正解候補の文字列配列）`,
      };
    }
    const question: BlankQuestion = {
      ...base,
      kind: "blank",
      template: data.template,
      accepted: data.accepted as string[][],
    };
    return { ok: true, question };
  }

  if (data.kind === "order") {
    if (!isStringArray(data.items) || data.items.length < 2) {
      return { ok: false, error: "items は正しい順の文字列を2つ以上、配列で入れてください" };
    }
    const items = data.items;
    if (data.acceptedOrders !== undefined) {
      if (
        !Array.isArray(data.acceptedOrders) ||
        !data.acceptedOrders.every(
          (order) => isStringArray(order) && order.length === items.length,
        )
      ) {
        return {
          ok: false,
          error: "acceptedOrders は items と同じ要素数の配列のリストにしてください（不要なら省略）",
        };
      }
    }
    const question: OrderQuestion = {
      ...base,
      kind: "order",
      items,
      ...(data.acceptedOrders !== undefined
        ? { acceptedOrders: data.acceptedOrders as string[][] }
        : {}),
    };
    return { ok: true, question };
  }

  if (data.kind === "bugfix" || data.kind === "code") {
    if (data.kind === "bugfix" && !isNonEmptyString(data.starter)) {
      return { ok: false, error: "starter（もとのコード）を入力してください" };
    }
    if (data.starter !== undefined && typeof data.starter !== "string") {
      return { ok: false, error: "starter は文字列にしてください" };
    }
    if (!LANGUAGES.includes(data.language as (typeof LANGUAGES)[number])) {
      return { ok: false, error: "language は html / css / js のいずれかにしてください" };
    }
    const listFields = [
      "accepted",
      "mustInclude",
      "mustIncludeClasses",
      "mustIncludeOrdered",
      "mustNotInclude",
    ] as const;
    for (const field of listFields) {
      if (data[field] !== undefined && !isStringArray(data[field])) {
        return { ok: false, error: `${field} は文字列の配列にしてください（不要なら省略）` };
      }
    }

    const common = omitUndefined({
      ...base,
      starter: data.starter as string | undefined,
      language: data.language as BugfixQuestion["language"],
      accepted: data.accepted as string[] | undefined,
      mustInclude: data.mustInclude as string[] | undefined,
      mustIncludeClasses: data.mustIncludeClasses as string[] | undefined,
      mustIncludeOrdered: data.mustIncludeOrdered as string[] | undefined,
      mustNotInclude: data.mustNotInclude as string[] | undefined,
    });

    if (data.kind === "bugfix") {
      if (!isNonEmptyString(data.solution)) {
        return { ok: false, error: "solution（正解のコード全体）を入力してください" };
      }
      const question: BugfixQuestion = {
        ...common,
        kind: "bugfix",
        starter: common.starter as string,
        solution: data.solution,
      };
      return { ok: true, question };
    }

    if (data.tests !== undefined) {
      const validTests =
        Array.isArray(data.tests) &&
        data.tests.every(
          (test) =>
            typeof test === "object" &&
            test !== null &&
            isNonEmptyString((test as Record<string, unknown>).call) &&
            "expected" in (test as Record<string, unknown>),
        );
      if (!validTests) {
        return {
          ok: false,
          error: "tests は { call: 呼び出し文字列, expected: 期待値 } の配列にしてください（不要なら省略）",
        };
      }
    }
    const question: CodeQuestion = {
      ...common,
      kind: "code",
      tests: data.tests as { call: string; expected: unknown }[] | undefined,
    };
    return { ok: true, question };
  }

  return {
    ok: false,
    error: "kind は choice / blank / order / bugfix / code のいずれかにしてください",
  };
}

