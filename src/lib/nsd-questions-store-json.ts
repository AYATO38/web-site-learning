import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { NextServerDayQuestion, StoredQuestion } from "@/lib/next-server-day";
import { nsdQuestions as DEFAULT_QUESTIONS } from "@/data/next-server-day";

const DATA_PATH = join(process.cwd(), "data", "nsd-questions.json");

type StoreFile = { questions: StoredQuestion[] };

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function seedDefaults(): StoredQuestion[] {
  const now = Date.now();
  const counters: Record<string, number> = {};
  return DEFAULT_QUESTIONS.map((question) => {
    const order = counters[question.difficulty] ?? 0;
    counters[question.difficulty] = order + 1;
    return { ...question, sortOrder: order, updatedAt: now };
  });
}

function readStore(): StoreFile {
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed || !Array.isArray(parsed.questions)) return { questions: seedDefaults() };
    return parsed;
  } catch {
    return { questions: seedDefaults() };
  }
}

function writeStore(store: StoreFile): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

function sortedBy(questions: StoredQuestion[]): StoredQuestion[] {
  return [...questions].sort(
    (a, b) =>
      a.difficulty.localeCompare(b.difficulty) || a.sortOrder - b.sortOrder,
  );
}

function nextSortOrder(questions: StoredQuestion[], difficulty: string): number {
  const inGroup = questions.filter((q) => q.difficulty === difficulty);
  return inGroup.length === 0 ? 0 : Math.max(...inGroup.map((q) => q.sortOrder)) + 1;
}

export async function listQuestions(): Promise<StoredQuestion[]> {
  return withLock(() => {
    const store = readStore();
    // Persist the seed so the file exists and stays the single source of
    // truth from here on, matching the Postgres backend's seed-once behavior.
    writeStore(store);
    return sortedBy(store.questions);
  });
}

export async function upsertQuestion(
  question: NextServerDayQuestion,
  sortOrder?: number,
): Promise<StoredQuestion> {
  return withLock(() => {
    const store = readStore();
    const now = Date.now();
    const existingIndex = store.questions.findIndex((q) => q.id === question.id);
    const order =
      sortOrder ??
      (existingIndex >= 0
        ? store.questions[existingIndex]!.sortOrder
        : nextSortOrder(store.questions, question.difficulty));
    const stored: StoredQuestion = { ...question, sortOrder: order, updatedAt: now };
    if (existingIndex >= 0) {
      store.questions[existingIndex] = stored;
    } else {
      store.questions.push(stored);
    }
    writeStore(store);
    return stored;
  });
}

export async function deleteQuestion(id: string): Promise<boolean> {
  return withLock(() => {
    const store = readStore();
    const next = store.questions.filter((q) => q.id !== id);
    const changed = next.length !== store.questions.length;
    if (changed) writeStore({ questions: next });
    return changed;
  });
}

export async function swapSortOrder(idA: string, idB: string): Promise<void> {
  return withLock(() => {
    const store = readStore();
    const a = store.questions.find((q) => q.id === idA);
    const b = store.questions.find((q) => q.id === idB);
    if (!a || !b) return;
    const temp = a.sortOrder;
    a.sortOrder = b.sortOrder;
    b.sortOrder = temp;
    writeStore(store);
  });
}
