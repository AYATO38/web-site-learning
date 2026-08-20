import { hasDatabaseUrl } from "@/lib/db";
import type { Account, ProfilePatch } from "@/lib/auth/types";
import type { MascotOutfit } from "@/lib/mascot";
import * as jsonStore from "@/lib/auth/store-json";
import * as pgStore from "@/lib/auth/store-pg";

export type { CreateAccountInput } from "@/lib/auth/store-json";

function backend() {
  if (hasDatabaseUrl()) return pgStore;
  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL がありません。Vercel の環境変数に Postgres の接続URLを設定してください。",
    );
  }
  return jsonStore;
}

export async function findAccountById(id: string): Promise<Account | undefined> {
  return backend().findAccountById(id);
}

export async function findAccountByEmail(
  email: string,
): Promise<Account | undefined> {
  return backend().findAccountByEmail(email);
}

export async function createAccount(
  input: jsonStore.CreateAccountInput,
): Promise<Account | "email_taken"> {
  return backend().createAccount(input);
}

export async function authenticate(
  email: string,
  password: string,
): Promise<Account | null> {
  return backend().authenticate(email, password);
}

export async function issuePasswordResetToken(
  email: string,
): Promise<string | null | "throttled"> {
  return backend().issuePasswordResetToken(email);
}

export async function resetPasswordWithToken(
  rawToken: string,
  password: string,
): Promise<Account | "invalid" | "same_password"> {
  return backend().resetPasswordWithToken(rawToken, password);
}

export async function updateAccountOutfit(
  userId: string,
  outfit: MascotOutfit,
): Promise<Account | undefined> {
  return backend().updateAccountOutfit(userId, outfit);
}

export async function updateAccountProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<Account | undefined> {
  return backend().updateAccountProfile(userId, patch);
}
