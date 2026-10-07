import { ensureDb } from "@/lib/db";
import { defaultLessons, withPhaseAndWeek, type Lesson } from "@/lib/lessons";

export type StoredLesson = Lesson & { sortOrder: number; updatedAt: number };

type LessonRow = {
  id: string;
  sort_order: number;
  data: Lesson | string;
  updated_at: string | number;
};

function rowToLesson(row: LessonRow): StoredLesson {
  const data =
    typeof row.data === "string" ? (JSON.parse(row.data) as Lesson) : row.data;
  return {
    ...data,
    id: row.id,
    sortOrder: row.sort_order,
    updatedAt: Number(row.updated_at),
  };
}

let seeded: Promise<void> | undefined;

/** Populates the table from the bundled defaults exactly once, if it's empty. */
function seedIfEmpty(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      const sql = await ensureDb();
      const rows = (await sql`SELECT count(*)::int AS count FROM lessons`) as {
        count: number;
      }[];
      if ((rows[0]?.count ?? 0) > 0) return;

      const now = Date.now();
      for (const [index, lesson] of defaultLessons.entries()) {
        await sql`
          INSERT INTO lessons (id, sort_order, data, updated_at)
          VALUES (${lesson.id}, ${index}, ${JSON.stringify(lesson)}::jsonb, ${now})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  return seeded;
}

export async function listLessons(): Promise<StoredLesson[]> {
  await seedIfEmpty();
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, sort_order, data, updated_at
    FROM lessons
    ORDER BY sort_order
  `) as LessonRow[];
  const stored = rows.map(rowToLesson);
  const lessons = withPhaseAndWeek(stored);

  // Rows saved under the old category scheme get their derived phase/week
  // written back once, so later edits to neighbours can't reshuffle them.
  const legacy = lessons.filter(
    (lesson, index) => stored[index]?.phase !== lesson.phase || stored[index]?.week !== lesson.week,
  );
  for (const lesson of legacy) {
    const data: Lesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      phase: lesson.phase,
      week: lesson.week,
    };
    await sql`
      UPDATE lessons SET data = ${JSON.stringify(data)}::jsonb WHERE id = ${lesson.id}
    `;
  }
  return lessons;
}

export async function upsertLesson(lesson: Lesson): Promise<StoredLesson> {
  await seedIfEmpty();
  const sql = await ensureDb();

  const existing = (await sql`
    SELECT sort_order FROM lessons WHERE id = ${lesson.id}
  `) as { sort_order: number }[];

  let order: number;
  if (existing[0]) {
    order = existing[0].sort_order;
  } else {
    const maxRow = (await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM lessons
    `) as { max: number }[];
    order = (maxRow[0]?.max ?? -1) + 1;
  }

  const now = Date.now();
  const rows = (await sql`
    INSERT INTO lessons (id, sort_order, data, updated_at)
    VALUES (${lesson.id}, ${order}, ${JSON.stringify(lesson)}::jsonb, ${now})
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
    RETURNING id, sort_order, data, updated_at
  `) as LessonRow[];
  return rowToLesson(rows[0]!);
}

export async function deleteLesson(id: string): Promise<boolean> {
  await seedIfEmpty();
  const sql = await ensureDb();
  const rows = (await sql`
    DELETE FROM lessons WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function swapLessonOrder(idA: string, idB: string): Promise<void> {
  await seedIfEmpty();
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, sort_order FROM lessons WHERE id = ${idA} OR id = ${idB}
  `) as { id: string; sort_order: number }[];
  const a = rows.find((row) => row.id === idA);
  const b = rows.find((row) => row.id === idB);
  if (!a || !b) return;
  await sql`UPDATE lessons SET sort_order = ${b.sort_order} WHERE id = ${idA}`;
  await sql`UPDATE lessons SET sort_order = ${a.sort_order} WHERE id = ${idB}`;
}
