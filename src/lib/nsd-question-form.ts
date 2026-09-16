import type {
  Difficulty,
  NextServerDayQuestion,
  QuestionKind,
  StoredQuestion,
} from "@/lib/next-server-day";

export type ExpectedType = "number" | "string" | "boolean" | "null";

export type TestFormRow = {
  call: string;
  expectedType: ExpectedType;
  expectedValue: string;
};

/**
 * One superset of editable fields, covering every question kind. Which ones
 * end up used depends on `kind` — buildQuestion() below reads only the
 * fields that matter for it when assembling the object to save.
 */
export type QuestionFormState = {
  id: string;
  difficulty: Difficulty;
  category: "HTML" | "CSS" | "JS" | "React";
  kind: QuestionKind;
  prompt: string;
  code: string;
  explanation: string;
  xp: string;

  // choice
  choices: string[];
  answerIndex: number;

  // blank
  template: string;
  blankAccepted: string[][];

  // order
  items: string[];
  // Alternate valid orderings aren't editable from the form (rare, and a
  // dedicated UI for "other full permutations of the same items" isn't
  // worth it) — preserved as-is from the loaded question if present.
  acceptedOrders?: string[][];

  // bugfix / code
  starter: string;
  /** bugfix only — the full corrected code, required. */
  solution: string;
  language: "html" | "css" | "js";
  accepted: string[];
  mustInclude: string[];
  mustIncludeClasses: string[];
  mustIncludeOrdered: string[];
  mustNotInclude: string[];
  tests: TestFormRow[];
};

export function blankCountOf(template: string): number {
  return (template.match(/___/g) ?? []).length;
}

/** Keeps existing accepted-answer lists lined up as blanks are added/removed. */
export function resizeBlankAccepted(
  current: string[][],
  blankCount: number,
): string[][] {
  const next = current.slice(0, blankCount);
  while (next.length < blankCount) next.push([]);
  return next;
}

function newId(kind: QuestionKind): string {
  return `new-${kind}-${Date.now().toString(36)}`;
}

export function emptyForm(kind: QuestionKind, difficulty: Difficulty): QuestionFormState {
  return {
    id: newId(kind),
    difficulty,
    category: "HTML",
    kind,
    prompt: "",
    code: "",
    explanation: "",
    xp: "50",
    choices: ["", "", "", ""],
    answerIndex: 0,
    template: "",
    blankAccepted: [],
    items: ["", ""],
    acceptedOrders: undefined,
    starter: "",
    solution: "",
    language: "html",
    accepted: [],
    mustInclude: [],
    mustIncludeClasses: [],
    mustIncludeOrdered: [],
    mustNotInclude: [],
    tests: [],
  };
}

function describeExpected(value: unknown): { expectedType: ExpectedType; expectedValue: string } {
  if (value === null) return { expectedType: "null", expectedValue: "" };
  if (typeof value === "boolean") {
    return { expectedType: "boolean", expectedValue: value ? "true" : "false" };
  }
  if (typeof value === "number") return { expectedType: "number", expectedValue: String(value) };
  return { expectedType: "string", expectedValue: String(value) };
}

export function formFromQuestion(question: StoredQuestion): QuestionFormState {
  const form = emptyForm(question.kind, question.difficulty);
  form.id = question.id;
  form.category = question.category;
  form.prompt = question.prompt;
  form.code = question.code ?? "";
  form.explanation = question.explanation;
  form.xp = String(question.xp);

  if (question.kind === "choice") {
    form.choices = [...question.choices];
    form.answerIndex = question.answerIndex;
  } else if (question.kind === "blank") {
    form.template = question.template;
    form.blankAccepted = question.accepted.map((list) => [...list]);
  } else if (question.kind === "order") {
    form.items = [...question.items];
    form.acceptedOrders = question.acceptedOrders;
  } else {
    form.starter = question.starter ?? "";
    if (question.kind === "bugfix") form.solution = question.solution;
    form.language = question.language;
    form.accepted = question.accepted ? [...question.accepted] : [];
    form.mustInclude = question.mustInclude ? [...question.mustInclude] : [];
    form.mustIncludeClasses = question.mustIncludeClasses
      ? [...question.mustIncludeClasses]
      : [];
    form.mustIncludeOrdered = question.mustIncludeOrdered
      ? [...question.mustIncludeOrdered]
      : [];
    form.mustNotInclude = question.mustNotInclude ? [...question.mustNotInclude] : [];
    if (question.kind === "code" && question.tests) {
      form.tests = question.tests.map((test) => ({
        call: test.call,
        ...describeExpected(test.expected),
      }));
    }
  }
  return form;
}

/** Resets to a blank form for the new kind, keeping the fields common to every kind. */
export function switchFormKind(form: QuestionFormState, kind: QuestionKind): QuestionFormState {
  const fresh = emptyForm(kind, form.difficulty);
  return {
    ...fresh,
    id: form.id,
    category: form.category,
    prompt: form.prompt,
    code: form.code,
    explanation: form.explanation,
    xp: form.xp,
  };
}

function parseExpected(row: TestFormRow): unknown {
  switch (row.expectedType) {
    case "null":
      return null;
    case "boolean":
      return row.expectedValue === "true";
    case "number":
      return Number(row.expectedValue);
    default:
      return row.expectedValue;
  }
}

function nonEmpty(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

/**
 * Assembles a candidate question from the form fields. This is deliberately
 * lenient about shape (empty arrays, blank strings) — validateQuestionInput
 * is still the single source of truth for what's actually valid and what
 * the error message should say, run on the result of this.
 */
export function buildQuestion(form: QuestionFormState): NextServerDayQuestion {
  const base = omitUndefined({
    id: form.id.trim(),
    difficulty: form.difficulty,
    category: form.category,
    prompt: form.prompt.trim(),
    explanation: form.explanation.trim(),
    xp: Number(form.xp),
    code: form.code.trim() || undefined,
  });

  if (form.kind === "choice") {
    return {
      ...base,
      kind: "choice",
      choices: form.choices as [string, string, string, string],
      answerIndex: form.answerIndex as 0 | 1 | 2 | 3,
    };
  }

  if (form.kind === "blank") {
    return {
      ...base,
      kind: "blank",
      template: form.template,
      accepted: form.blankAccepted.map((list) => nonEmpty(list)),
    };
  }

  if (form.kind === "order") {
    return omitUndefined({
      ...base,
      kind: "order",
      items: nonEmpty(form.items),
      acceptedOrders: form.acceptedOrders,
    });
  }

  const common = omitUndefined({
    ...base,
    starter: form.starter || undefined,
    language: form.language,
    accepted: nonEmpty(form.accepted).length ? nonEmpty(form.accepted) : undefined,
    mustInclude: nonEmpty(form.mustInclude).length ? nonEmpty(form.mustInclude) : undefined,
    mustIncludeClasses: nonEmpty(form.mustIncludeClasses).length
      ? nonEmpty(form.mustIncludeClasses)
      : undefined,
    mustIncludeOrdered: nonEmpty(form.mustIncludeOrdered).length
      ? nonEmpty(form.mustIncludeOrdered)
      : undefined,
    mustNotInclude: nonEmpty(form.mustNotInclude).length
      ? nonEmpty(form.mustNotInclude)
      : undefined,
  });

  if (form.kind === "bugfix") {
    return {
      ...common,
      kind: "bugfix",
      starter: common.starter ?? "",
      solution: form.solution.trim(),
    };
  }

  const tests = form.tests
    .filter((test) => test.call.trim())
    .map((test) => ({ call: test.call, expected: parseExpected(test) }));
  return omitUndefined({
    ...common,
    kind: "code",
    tests: tests.length ? tests : undefined,
  });
}
