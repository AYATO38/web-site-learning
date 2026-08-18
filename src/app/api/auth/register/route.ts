import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { createAccount } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";
import { parseSignupBody } from "@/lib/auth/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseSignupBody(await request.json().catch(() => null));
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const account = await createAccount(parsed);
  if (account === "email_taken") {
    return NextResponse.json(
      { error: "このメールアドレスはすでに登録されています" },
      { status: 409 },
    );
  }

  await setSessionCookie(account.id);
  return NextResponse.json({ user: toPublicUser(account) }, { status: 201 });
}
