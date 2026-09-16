import type { NextServerDayQuestion, StoredQuestion } from "@/lib/next-server-day";
import { nsdQuestions as DEFAULT_QUESTIONS } from "@/data/next-server-day";
import { ensureDb } from "@/lib/db";

type QuestionRow = {
  id: string;
  difficulty: string;
  sort_order: number;
  data: NextServerDayQuestion | string;
  updated_at: string | number;
};

function rowToQuestion(row: QuestionRow): StoredQuestion {
  const data =
    typeof row.data === "string"
      ? (JSON.parse(row.data) as NextServerDayQuestion)
      : row.data;
  return { ...data, sortOrder: row.sort_order, updatedAt: Number(row.updated_at) };
}

let seeded: Promise<void> | undefined;

/** Populates the table from the bundled defaults exactly once, if it's empty. */
function seedIfEmpty(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const sql = await ensureDb();
      const rows = (await sql`SELECT count(*)::int AS count FROM nsd_questions`) as {
        count: number;
      }[];
      if ((rows[0]?.count ?? 0) > 0) return;

      const now = Date.now();
      const counters: Record<string, number> = {};
      for (const question of DEFAULT_QUESTIONS) {
        const order = counters[question.difficulty] ?? 0;
        counters[question.difficulty] = order + 1;
        await sql`
          INSERT INTO nsd_questions (id, difficulty, sort_order, data, updated_at)
          VALUES (
            ${question.id},
            ${question.difficulty},
            ${order},
            ${JSON.stringify(question)}::jsonb,
            ${now}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  return seeded;
}

export async function listQuestions(): Promise<StoredQuestion[]> {
  await seedIfEmpty();
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, difficulty, sort_order, data, updated_at
    FROM nsd_questions
    ORDER BY difficulty, sort_order
  `) as QuestionRow[];
  return rows.map(rowToQuestion);
}

export async function upsertQuestion(
  question: NextServerDayQuestion,
  sortOrder?: number,
): Promise<StoredQuestion> {
  await seedIfEmpty();
  const sql = await ensureDb();

  let order = sortOrder;
  if (order === undefined) {
    const existing = (await sql`
      SELECT sort_order FROM nsd_questions WHERE id = ${question.id}
    `) as { sort_order: number }[];
    if (existing[0]) {
      order = existing[0].sort_order;
    } else {
      const maxRow = (await sql`
        SELECT COALESCE(MAX(sort_order), -1)::int AS max
        FROM nsd_questions WHERE difficulty = ${question.difficulty}
      `) as { max: number }[];
      order = (maxRow[0]?.max ?? -1) + 1;
    }
  }

  const now = Date.now();
  const rows = (await sql`
    INSERT INTO nsd_questions (id, difficulty, sort_order, data, updated_at)
    VALUES (
      ${question.id},
      ${question.difficulty},
      ${order},
      ${JSON.stringify(question)}::jsonb,
      ${now}
    )
    ON CONFLICT (id) DO UPDATE SET
      difficulty = EXCLUDED.difficulty,
      sort_order = EXCLUDED.sort_order,
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
    RETURNING id, difficulty, sort_order, data, updated_at
  `) as QuestionRow[];
  return rowToQuestion(rows[0]!);
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const sql = await ensureDb();
  const rows = (await sql`
    DELETE FROM nsd_questions WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function swapSortOrder(idA: string, idB: string): Promise<void> {
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, sort_order FROM nsd_questions WHERE id = ${idA} OR id = ${idB}
  `) as { id: string; sort_order: number }[];
  const a = rows.find((row) => row.id === idA);
  const b = rows.find((row) => row.id === idB);
  if (!a || !b) return;
  await sql`UPDATE nsd_questions SET sort_order = ${b.sort_order} WHERE id = ${idA}`;
  await sql`UPDATE nsd_questions SET sort_order = ${a.sort_order} WHERE id = ${idB}`;
}
