import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { listMaterials, upsertMaterial } from "@/lib/materials-store";
import { validateMaterialInput } from "@/lib/material-validate";

function newId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  const materials = await listMaterials();
  return NextResponse.json({ materials, canEdit: isQuestionEditor(userId) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!isQuestionEditor(userId)) {
    return NextResponse.json({ error: "この機能を使う権限がありません" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { material?: unknown } | null;
  // New items get a generated id; editors never have to think one up.
  const input = body?.material && typeof body.material === "object" ? body.material : {};
  const result = validateMaterialInput({ ...input, id: newId("material") });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await listMaterials();
  if (existing.some((material) => material.id === result.material.id)) {
    return NextResponse.json(
      { error: "保存に失敗しました。もう一度「追加する」を押してください" },
      { status: 409 },
    );
  }

  const stored = await upsertMaterial(result.material);
  return NextResponse.json({ material: stored });
}
