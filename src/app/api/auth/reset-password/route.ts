import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { resetPasswordWithToken } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";
import { parseResetPasswordBody } from "@/lib/auth/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseResetPasswordBody(await request.json().catch(() => null));
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const account = await resetPasswordWithToken(parsed.token, parsed.password);
  if (account === "invalid") {
    return NextResponse.json(
      { error: "リンクの有効期限が切れているか、無効です。もう一度やり直してください" },
      { status: 400 },
    );
  }
  if (account === "same_password") {
    return NextResponse.json(
      { error: "今までと同じパスワードには変更できません" },
      { status: 400 },
    );
  }

  await setSessionCookie(account.id);
  return NextResponse.json({ user: toPublicUser(account) });
}
