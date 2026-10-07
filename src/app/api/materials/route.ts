import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { isQuestionEditor } from "@/lib/nsd-question-admin";
import { listMaterials, upsertMaterial } from "@/lib/materials-store";
import { validateMaterialInput } from "@/lib/material-validate";

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
  const result = validateMaterialInput(body?.material);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await listMaterials();
  if (existing.some((material) => material.id === result.material.id)) {
    return NextResponse.json(
      { error: "この id はすでに使われています。別の id にしてください" },
      { status: 409 },
    );
  }

  const stored = await upsertMaterial(result.material);
  return NextResponse.json({ material: stored });
}
