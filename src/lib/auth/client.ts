import type { PublicUser } from "@/lib/auth/types";
import type { MascotOutfit } from "@/lib/mascot";

export const AUTH_EVENT = "posse-auth-changed";

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

function errorMessage(body: Record<string, unknown>, fallback: string): string {
  return typeof body.error === "string" ? body.error : fallback;
}

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (res.status === 401) return null;
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "取得に失敗しました"));
  return body.user as PublicUser;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  university: string;
}): Promise<PublicUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "登録に失敗しました"));
  return body.user as PublicUser;
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(body, "ログインに失敗しました"));
  return body.user as PublicUser;
}

export async function logoutAccount(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(body, "メールを送信できませんでした"));
  }
}

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<PublicUser> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(body, "パスワードの再設定に失敗しました"));
  }
  return body.user as PublicUser;
}

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export async function saveAccountOutfit(outfit: MascotOutfit): Promise<PublicUser> {
  const res = await fetch("/api/auth/outfit", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outfit }),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(body, "キャラクターを保存できませんでした"));
  }
  return body.user as PublicUser;
}
