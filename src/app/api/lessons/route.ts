import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { listLessons, upsertLesson } from "@/lib/lessons-store";
import { validateLessonInput } from "@/lib/lesson-validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  const lessons = await listLessons();
  return NextResponse.json({ lessons, canEdit: isQuestionEditor(userId) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json({ error: "この機能を使う権限がありません" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { lesson?: unknown } | null;
  const result = validateLessonInput(body?.lesson);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await listLessons();
  if (existing.some((lesson) => lesson.id === result.lesson.id)) {
    return NextResponse.json(
      { error: "この id はすでに使われています。別の id にしてください" },
      { status: 409 },
    );
  }

  const stored = await upsertLesson(result.lesson);
  return NextResponse.json({ lesson: stored });
}
