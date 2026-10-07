import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { deleteMaterial, swapMaterialOrder, upsertMaterial } from "@/lib/materials-store";
import { validateMaterialInput } from "@/lib/material-validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function requireEditor() {
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json({ error: "この機能を使う権限がありません" }, { status: 403 });
  }
  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const denied = await requireEditor();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { material?: unknown } | null;
  const result = validateMaterialInput(body?.material);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.material.id !== id) {
    return NextResponse.json(
      { error: "id は変更できません。id を変えたいときは削除して作り直してください" },
      { status: 400 },
    );
  }

  const stored = await upsertMaterial(result.material);
  return NextResponse.json({ material: stored });
}

/** Reorders by swapping this material's place with another's. */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const denied = await requireEditor();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { swapWith?: unknown } | null;
  if (typeof body?.swapWith !== "string" || !body.swapWith) {
    return NextResponse.json({ error: "swapWith が必要です" }, { status: 400 });
  }

  await swapMaterialOrder(id, body.swapWith);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const denied = await requireEditor();
  if (denied) return denied;

  const removed = await deleteMaterial(id);
  if (!removed) {
    return NextResponse.json({ error: "資料が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
