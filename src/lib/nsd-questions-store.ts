import { hasDatabaseUrl } from "@/lib/db";
import type { NextServerDayQuestion, StoredQuestion } from "@/lib/next-server-day";
import * as jsonStore from "@/lib/nsd-questions-store-json";
import * as pgStore from "@/lib/nsd-questions-store-pg";

function backend() {
  if (hasDatabaseUrl()) return pgStore;
  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL がありません。Vercel の環境変数に Postgres の接続URLを設定してください。",
    );
  }
  return jsonStore;
}

export async function listQuestions(): Promise<StoredQuestion[]> {
  return backend().listQuestions();
}

export async function upsertQuestion(
  question: NextServerDayQuestion,
  sortOrder?: number,
): Promise<StoredQuestion> {
  return backend().upsertQuestion(question, sortOrder);
}

export async function deleteQuestion(id: string): Promise<boolean> {
  return backend().deleteQuestion(id);
}

export async function swapSortOrder(idA: string, idB: string): Promise<void> {
  return backend().swapSortOrder(idA, idB);
}
