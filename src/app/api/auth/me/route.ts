import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { findAccountById } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  const account = findAccountById(userId);
  if (!account) {
    return NextResponse.json({ error: "未ログインです" }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicUser(account) });
}
