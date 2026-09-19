import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;

let cached: Sql | undefined;
let schemaReady: Promise<void> | undefined;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getSql(): Sql {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL がありません。Postgres（Neon）の接続URLを .env.local または Vercel の環境変数に設定してください。",
    );
  }
  if (!cached) cached = neon(url);
  return cached;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

export function asUniqueViolation(error: unknown): boolean {
  return isUniqueViolation(error);
}

export async function ensureDb(): Promise<Sql> {
  const sql = getSql();
  if (!schemaReady) {
    schemaReady = (async () => {
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
        CREATE INDEX IF NOT EXISTS rooms_updated_at_idx ON rooms (updated_at)
      `);
      await sql.query(`
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS outfit JSONB
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_member_id TEXT
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_name TEXT
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gallery_capacity INTEGER
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gallery JSONB
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS settings_notice TEXT
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS settings_updated_at BIGINT
      `);
      await sql.query(`
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS faculty TEXT
      `);
      await sql.query(`
        ALTER TABLE accounts ADD COLUMN IF NOT EXISTS department TEXT
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS released_question INTEGER
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS results_released BOOLEAN
      `);
      await sql.query(`
        ALTER TABLE rooms ADD COLUMN IF NOT EXISTS final_results_released BOOLEAN
      `);
      await sql.query(`
        CREATE TABLE IF NOT EXISTS nsd_questions (
          id TEXT PRIMARY KEY,
          difficulty TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          data JSONB NOT NULL,
          updated_at BIGINT NOT NULL
        )
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS nsd_questions_difficulty_idx
          ON nsd_questions (difficulty, sort_order)
      `);
    })();
  }
  await schemaReady;
  return sql;
}
