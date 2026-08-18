export type SignupInput = {
  name: string;
  email: string;
  password: string;
  university: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseSignupBody(body: unknown): SignupInput | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const university =
    typeof data.university === "string" ? data.university.trim() : "";

  if (name.length < 1 || name.length > 40) {
    return "名前は1〜40文字で入力してください";
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return "メールアドレスの形式が正しくありません";
  }
  if (!isValidPassword(password)) {
    return "パスワードは8文字以上にしてください";
  }
  if (university.length > 80) {
    return "大学名は80文字以内にしてください";
  }

  return {
    name,
    email,
    password,
    university: university || null,
  };
}

export function parseLoginBody(
  body: unknown,
): { email: string; password: string } | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !password) return "メールアドレスとパスワードを入力してください";
  return { email, password };
}

export function parseEmailBody(body: unknown): { email: string } | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return "メールアドレスの形式が正しくありません";
  }
  return { email };
}

export function parseResetPasswordBody(
  body: unknown,
): { token: string; password: string } | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;
  const token = typeof data.token === "string" ? data.token.trim() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!token) return "再設定用リンクが無効です";
  if (!isValidPassword(password)) {
    return "パスワードは8文字以上にしてください";
  }
  return { token, password };
}

function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}
