import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const DATA_DIR = join(process.cwd(), "data");

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL がありません。.env.local を確認してください。");
  process.exit(1);
}

const sql = neon(url);

function readJson(name) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
  } catch {
    return null;
  }
}

await sql.query(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    university TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    reset_token_hash TEXT,
    reset_token_expires_at BIGINT,
    last_reset_requested_at BIGINT
  )
`);
await sql.query(`
  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    teams JSONB NOT NULL,
    updated_at BIGINT NOT NULL
  )
`);
await sql.query(`
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS outfit JSONB
`);

const accountsFile = readJson("accounts.json");
const accounts = Array.isArray(accountsFile?.accounts) ? accountsFile.accounts : [];
let accountCount = 0;
for (const account of accounts) {
  if (!account?.id || !account?.email || !account?.passwordHash) continue;
  await sql`
    INSERT INTO accounts (
      id, name, email, university, password_hash, created_at,
      reset_token_hash, reset_token_expires_at, last_reset_requested_at
    ) VALUES (
      ${account.id},
      ${account.name ?? ""},
      ${String(account.email).trim().toLowerCase()},
      ${account.university ?? null},
      ${account.passwordHash},
      ${account.createdAt ?? new Date().toISOString()},
      ${account.resetTokenHash ?? null},
      ${account.resetTokenExpiresAt ?? null},
      ${account.lastResetRequestedAt ?? null}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  accountCount += 1;
}

const roomsFile = readJson("nsd-rooms.json");
const rooms = Array.isArray(roomsFile?.rooms) ? roomsFile.rooms : [];
let roomCount = 0;
for (const room of rooms) {
  if (!room?.id || !Array.isArray(room.teams)) continue;
  await sql`
    INSERT INTO rooms (id, teams, updated_at)
    VALUES (${room.id}, ${JSON.stringify(room.teams)}::jsonb, ${room.updatedAt ?? Date.now()})
    ON CONFLICT (id) DO NOTHING
  `;
  roomCount += 1;
}

console.log(`migrated ${accountCount} account(s), ${roomCount} room(s)`);
