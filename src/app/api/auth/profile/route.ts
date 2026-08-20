import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { findAccountById, updateAccountProfile } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";
import { parseProfileUpdateBody } from "@/lib/auth/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  const account = await findAccountById(userId);
  if (!account) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  const parsed = parseProfileUpdateBody(await request.json().catch(() => null));
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const updated = await updateAccountProfile(userId, parsed);
  if (!updated) {
    return NextResponse.json({ error: "保存できませんでした" }, { status: 500 });
  }

  return NextResponse.json({ user: toPublicUser(updated) });
}
