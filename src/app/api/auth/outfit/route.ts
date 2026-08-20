import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { updateAccountOutfit } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";
import { normalizeOutfit } from "@/lib/mascot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    outfit?: unknown;
  } | null;
  const outfit = normalizeOutfit(body?.outfit);
  const account = await updateAccountOutfit(userId, outfit);
  if (!account) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicUser(account) });
}
