import nodemailer from "nodemailer";

type MailConfig = {
  user: string;
  pass: string;
};

export function getMailConfig(): MailConfig | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return null;
  return { user, pass };
}

function appOrigin(request: Request): string {
  const fromEnv = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return new URL(request.url).origin;
}

export async function sendResetEmail(
  toEmail: string,
  token: string,
  request: Request,
) {
  const config = getMailConfig();
  if (!config) {
    throw new Error("Gmail is not configured");
  }

  const link = `${appOrigin(request)}/account/reset?token=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: `"POSSE Learning" <${config.user}>`,
    to: toEmail,
    subject: "【POSSE Learning】パスワード再設定",
    text: [
      "パスワード再設定のリクエストを受け付けました。",
      "下のリンクを開いて、新しいパスワードを設定してください。",
      "",
      link,
      "",
      "このリンクの有効期限は30分です。",
      "このメールに心当たりがない場合は、無視してください。",
    ].join("\n"),
    html: `
      <p>パスワード再設定のリクエストを受け付けました。</p>
      <p>下のボタンから、新しいパスワードを設定してください。</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#3b9eff;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">パスワードを再設定する</a></p>
      <p>リンクの有効期限は30分です。<br />このメールに心当たりがない場合は、無視してください。</p>
    `,
  });
}
