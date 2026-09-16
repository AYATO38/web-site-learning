import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { listQuestions, upsertQuestion } from "@/lib/nsd-questions-store";
import { validateQuestionInput } from "@/lib/nsd-question-validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  const questions = await listQuestions();
  return NextResponse.json({ questions, canEdit: isQuestionEditor(userId) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json(
      { error: "この機能を使う権限がありません" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = validateQuestionInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await listQuestions();
  if (existing.some((question) => question.id === result.question.id)) {
    return NextResponse.json(
      { error: "この id はすでに使われています。別の id にしてください" },
      { status: 409 },
    );
  }

  const stored = await upsertQuestion(result.question);
  return NextResponse.json({ question: stored });
}
