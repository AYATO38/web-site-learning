import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { deleteQuestion, swapSortOrder, upsertQuestion } from "@/lib/nsd-questions-store";
import { validateQuestionInput } from "@/lib/nsd-question-validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json(
      { error: "この機能を使う権限がありません" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const result = validateQuestionInput(body?.question);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.question.id !== id) {
    return NextResponse.json(
      { error: "id は変更できません。id を変えたいときは削除して作り直してください" },
      { status: 400 },
    );
  }

  const stored = await upsertQuestion(result.question);
  return NextResponse.json({ question: stored });
}

/** Reorders within a difficulty by swapping this question's place with another's. */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json(
      { error: "この機能を使う権限がありません" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { swapWith?: unknown } | null;
  if (typeof body?.swapWith !== "string" || !body.swapWith) {
    return NextResponse.json({ error: "swapWith が必要です" }, { status: 400 });
  }

  await swapSortOrder(id, body.swapWith);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json(
      { error: "この機能を使う権限がありません" },
      { status: 403 },
    );
  }

  const removed = await deleteQuestion(id);
  if (!removed) {
    return NextResponse.json({ error: "問題が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
