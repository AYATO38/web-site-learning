import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Account } from "@/lib/auth/types";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createResetToken, hashResetToken } from "@/lib/auth/reset-token";

const RESET_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;
const DATA_PATH = join(process.cwd(), "data", "accounts.json");

type StoreFile = {
  accounts: Account[];
};

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function emptyStore(): StoreFile {
  return { accounts: [] };
}

function readStore(): StoreFile {
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed || !Array.isArray(parsed.accounts)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreFile): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function findAccountById(id: string): Promise<Account | undefined> {
  return readStore().accounts.find((account) => account.id === id);
}

export async function findAccountByEmail(
  email: string,
): Promise<Account | undefined> {
  const normalized = email.trim().toLowerCase();
  return readStore().accounts.find((account) => account.email === normalized);
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
  return withLock(async () => {
    const store = readStore();
    const email = input.email.trim().toLowerCase();
    if (store.accounts.some((account) => account.email === email)) {
      return "email_taken";
    }

    const account: Account = {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      university: input.university?.trim() || null,
      passwordHash: await hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };

    store.accounts.push(account);
    writeStore(store);
    return account;
  });
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
  return withLock(() => {
    const store = readStore();
    const normalized = email.trim().toLowerCase();
    const account = store.accounts.find((item) => item.email === normalized);
    if (!account) return null;

    const now = Date.now();
    if (
      typeof account.lastResetRequestedAt === "number" &&
      now - account.lastResetRequestedAt < RESET_COOLDOWN_MS
    ) {
      return "throttled";
    }

    const token = createResetToken();
    account.resetTokenHash = token.hash;
    account.resetTokenExpiresAt = now + RESET_TTL_MS;
    account.lastResetRequestedAt = now;
    writeStore(store);
    return token.raw;
  });
}

export async function resetPasswordWithToken(
  rawToken: string,
  password: string,
): Promise<Account | "invalid" | "same_password"> {
  return withLock(async () => {
    const store = readStore();
    const hash = hashResetToken(rawToken);
    const now = Date.now();
    const account = store.accounts.find(
      (item) =>
        item.resetTokenHash === hash &&
        typeof item.resetTokenExpiresAt === "number" &&
        item.resetTokenExpiresAt > now,
    );
    if (!account) return "invalid";

    if (await verifyPassword(password, account.passwordHash)) {
      return "same_password";
    }

    account.passwordHash = await hashPassword(password);
    account.resetTokenHash = null;
    account.resetTokenExpiresAt = null;
    writeStore(store);
    return account;
  });
}
