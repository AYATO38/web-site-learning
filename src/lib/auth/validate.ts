import {
  REQUIRED_PROFILE_FIELDS,
  type ProfilePatch,
} from "@/lib/auth/types";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  university: string;
  faculty: string;
  department: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredText(
  value: unknown,
  label: string,
  max: number,
): string | { error: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < 1 || text.length > max) {
    return { error: `${label}は1〜${max}文字で入力してください` };
  }
  return text;
}

function parseRequiredProfile(
  data: Record<string, unknown>,
): ProfilePatch | string {
  const parsed: ProfilePatch = {};
  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = requiredText(data[field.key], field.label, field.max);
    if (typeof value !== "string") return value.error;
    parsed[field.key] = value;
  }
  return parsed;
}

export function parseSignupBody(body: unknown): SignupInput | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const profile = parseRequiredProfile(data);

  if (name.length < 1 || name.length > 40) {
    return "名前は1〜40文字で入力してください";
  }
  if (!EMAIL_RE.test(email) || email.length > 120) {
    return "メールアドレスの形式が正しくありません";
  }
  if (!isValidPassword(password)) {
    return "パスワードは8文字以上にしてください";
  }
  if (typeof profile === "string") return profile;

  return {
    name,
    email,
    password,
    university: profile.university ?? "",
    faculty: profile.faculty ?? "",
    department: profile.department ?? "",
  };
}

export function parseProfileUpdateBody(body: unknown): ProfilePatch | string {
  if (!body || typeof body !== "object") return "入力が不正です";
  const data = body as Record<string, unknown>;
  const profile = parseRequiredProfile(data);
  if (typeof profile === "string") return profile;

  const updates: ProfilePatch = { ...profile };
  if ("name" in data) {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (name.length < 1 || name.length > 40) {
      return "名前は1〜40文字で入力してください";
    }
    updates.name = name;
  }
  return updates;
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
