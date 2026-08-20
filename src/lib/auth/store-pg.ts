import { randomUUID } from "node:crypto";
import type { Account } from "@/lib/auth/types";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createResetToken, hashResetToken } from "@/lib/auth/reset-token";
import { asUniqueViolation, ensureDb } from "@/lib/db";
import { normalizeOutfit, type MascotOutfit } from "@/lib/mascot";

const RESET_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;

type AccountRow = {
  id: string;
  name: string;
  email: string;
  university: string | null;
  password_hash: string;
  created_at: string;
  reset_token_hash: string | null;
  reset_token_expires_at: string | number | null;
  last_reset_requested_at: string | number | null;
  outfit: unknown;
};

function toNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    university: row.university,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    resetTokenHash: row.reset_token_hash,
    resetTokenExpiresAt: toNumber(row.reset_token_expires_at),
    lastResetRequestedAt: toNumber(row.last_reset_requested_at),
    outfit: row.outfit == null ? null : normalizeOutfit(row.outfit),
  };
}

export async function findAccountById(id: string): Promise<Account | undefined> {
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT * FROM accounts WHERE id = ${id} LIMIT 1
  `) as AccountRow[];
  return rows[0] ? mapAccount(rows[0]) : undefined;
}

export async function findAccountByEmail(
  email: string,
): Promise<Account | undefined> {
  const sql = await ensureDb();
  const normalized = email.trim().toLowerCase();
  const rows = (await sql`
    SELECT * FROM accounts WHERE email = ${normalized} LIMIT 1
  `) as AccountRow[];
  return rows[0] ? mapAccount(rows[0]) : undefined;
}

export type CreateAccountInput = {
  name: string;
  email: string;
  password: string;
  university?: string | null;
};

export async function createAccount(
  input: CreateAccountInput,
): Promise<Account | "email_taken"> {
  const sql = await ensureDb();
  const email = input.email.trim().toLowerCase();
  const account: Account = {
    id: randomUUID(),
    name: input.name.trim(),
    email,
    university: input.university?.trim() || null,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  try {
    await sql`
      INSERT INTO accounts (
        id, name, email, university, password_hash, created_at
      ) VALUES (
        ${account.id},
        ${account.name},
        ${account.email},
        ${account.university},
        ${account.passwordHash},
        ${account.createdAt}
      )
    `;
  } catch (error) {
    if (asUniqueViolation(error)) return "email_taken";
    throw error;
  }

  return account;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<Account | null> {
  const account = await findAccountByEmail(email);
  if (!account) return null;
  const ok = await verifyPassword(password, account.passwordHash);
  return ok ? account : null;
}

export async function issuePasswordResetToken(
  email: string,
): Promise<string | null | "throttled"> {
  const sql = await ensureDb();
  const account = await findAccountByEmail(email);
  if (!account) return null;

  const now = Date.now();
  if (
    typeof account.lastResetRequestedAt === "number" &&
    now - account.lastResetRequestedAt < RESET_COOLDOWN_MS
  ) {
    return "throttled";
  }

  const token = createResetToken();
  await sql`
    UPDATE accounts
    SET
      reset_token_hash = ${token.hash},
      reset_token_expires_at = ${now + RESET_TTL_MS},
      last_reset_requested_at = ${now}
    WHERE id = ${account.id}
  `;
  return token.raw;
}

export async function resetPasswordWithToken(
  rawToken: string,
  password: string,
): Promise<Account | "invalid" | "same_password"> {
  const sql = await ensureDb();
  const hash = hashResetToken(rawToken);
  const now = Date.now();
  const rows = (await sql`
    SELECT * FROM accounts
    WHERE reset_token_hash = ${hash}
      AND reset_token_expires_at IS NOT NULL
      AND reset_token_expires_at > ${now}
    LIMIT 1
  `) as AccountRow[];
  const row = rows[0];
  if (!row) return "invalid";

  const account = mapAccount(row);
  if (await verifyPassword(password, account.passwordHash)) {
    return "same_password";
  }

  const passwordHash = await hashPassword(password);
  await sql`
    UPDATE accounts
    SET
      password_hash = ${passwordHash},
      reset_token_hash = NULL,
      reset_token_expires_at = NULL
    WHERE id = ${account.id}
  `;
  return { ...account, passwordHash, resetTokenHash: null, resetTokenExpiresAt: null };
}

export async function updateAccountOutfit(
  userId: string,
  outfit: MascotOutfit,
): Promise<Account | undefined> {
  const sql = await ensureDb();
  const next = normalizeOutfit(outfit);
  const rows = (await sql`
    UPDATE accounts
    SET outfit = ${JSON.stringify(next)}::jsonb
    WHERE id = ${userId}
    RETURNING *
  `) as AccountRow[];
  return rows[0] ? mapAccount(rows[0]) : undefined;
}
