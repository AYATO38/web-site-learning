import type { NextServerDayQuestion, StoredQuestion } from "@/lib/next-server-day";

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

function errorMessage(body: Record<string, unknown>, fallback: string): string {
  return typeof body.error === "string" ? body.error : fallback;
}

export async function fetchQuestionsList(): Promise<{
  questions: StoredQuestion[];
  canEdit: boolean;
}> {
  const res = await fetch("/api/nsd/questions", { cache: "no-store" });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "問題を取得できませんでした"));
  return {
    questions: (body.questions as StoredQuestion[] | undefined) ?? [],
    canEdit: Boolean(body.canEdit),
  };
}

export async function createQuestion(
  question: NextServerDayQuestion,
): Promise<StoredQuestion> {
  const res = await fetch("/api/nsd/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "問題を追加できませんでした"));
  return body.question as StoredQuestion;
}

export async function updateQuestion(
  id: string,
  question: NextServerDayQuestion,
): Promise<StoredQuestion> {
  const res = await fetch(`/api/nsd/questions/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "問題を保存できませんでした"));
  return body.question as StoredQuestion;
}

export async function deleteQuestionRequest(id: string): Promise<void> {
  const res = await fetch(`/api/nsd/questions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await readJson(res);
    throw new Error(errorMessage(body, "問題を削除できませんでした"));
  }
}

export async function swapQuestionOrder(id: string, swapWithId: string): Promise<void> {
  const res = await fetch(`/api/nsd/questions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ swapWith: swapWithId }),
  });
  if (!res.ok) {
    const body = await readJson(res);
    throw new Error(errorMessage(body, "並び替えできませんでした"));
  }
}
