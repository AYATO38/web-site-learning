import { NextResponse } from "next/server";
import { getMailConfig, sendResetEmail } from "@/lib/auth/mail";
import {
  findAccountByEmail,
  issuePasswordResetToken,
} from "@/lib/auth/store";
import { parseEmailBody } from "@/lib/auth/validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GENERIC_OK = {
  message:
    "入力されたアドレスにアカウントがある場合、再設定用のメールを送りました。",
};

export async function POST(request: Request) {
  const parsed = parseEmailBody(await request.json().catch(() => null));
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  if (!getMailConfig()) {
    return NextResponse.json(
      {
        error: process.env.VERCEL
          ? "アプリの送信元メールが未設定です。Vercel の環境変数に GMAIL_USER と GMAIL_APP_PASSWORD を設定してください。"
          : "アプリの送信元メールが未設定です。プロジェクト直下の .env.local に GMAIL_USER と GMAIL_APP_PASSWORD を書いて、開発サーバーを再起動してください。",
      },
      { status: 503 },
    );
  }

  const user = await findAccountByEmail(parsed.email);
  if (user) {
    const token = await issuePasswordResetToken(user.email);
    if (token && token !== "throttled") {
      try {
        await sendResetEmail(user.email, token, request);
      } catch (error) {
        console.error("Failed to send reset email", error);
        return NextResponse.json(
          {
            error:
              "メールを送信できませんでした。Gmailのアプリパスワードを確認してください。",
          },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json(GENERIC_OK);
}
