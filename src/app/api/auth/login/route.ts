import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { authenticate } from "@/lib/auth/store";
import { toPublicUser } from "@/lib/auth/types";
import { parseLoginBody } from "@/lib/auth/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseLoginBody(await request.json().catch(() => null));
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  const account = await authenticate(parsed.email, parsed.password);
  if (!account) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが違います" },
      { status: 401 },
    );
  }

  await setSessionCookie(account.id);
  return NextResponse.json({ user: toPublicUser(account) });
}
