import { ensureDb } from "@/lib/db";
import type { Material } from "@/lib/materials";

export type StoredMaterial = Material & { sortOrder: number; updatedAt: number };

type MaterialRow = {
  id: string;
  sort_order: number;
  data: Material | string;
  updated_at: string | number;
};

function rowToMaterial(row: MaterialRow): StoredMaterial {
  const data =
    typeof row.data === "string" ? (JSON.parse(row.data) as Material) : row.data;
  return {
    ...data,
    id: row.id,
    sortOrder: row.sort_order,
    updatedAt: Number(row.updated_at),
  };
}

export async function listMaterials(): Promise<StoredMaterial[]> {
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, sort_order, data, updated_at
    FROM materials
    ORDER BY sort_order
  `) as MaterialRow[];
  return rows.map(rowToMaterial);
}

export async function upsertMaterial(material: Material): Promise<StoredMaterial> {
  const sql = await ensureDb();

  const existing = (await sql`
    SELECT sort_order FROM materials WHERE id = ${material.id}
  `) as { sort_order: number }[];

  let order: number;
  if (existing[0]) {
    order = existing[0].sort_order;
  } else {
    const maxRow = (await sql`
      SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM materials
    `) as { max: number }[];
    order = (maxRow[0]?.max ?? -1) + 1;
  }

  const now = Date.now();
  const rows = (await sql`
    INSERT INTO materials (id, sort_order, data, updated_at)
    VALUES (${material.id}, ${order}, ${JSON.stringify(material)}::jsonb, ${now})
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
    RETURNING id, sort_order, data, updated_at
  `) as MaterialRow[];
  return rowToMaterial(rows[0]!);
}

export async function deleteMaterial(id: string): Promise<boolean> {
  const sql = await ensureDb();
  const rows = (await sql`
    DELETE FROM materials WHERE id = ${id} RETURNING id
  `) as { id: string }[];
  return rows.length > 0;
}

export async function swapMaterialOrder(idA: string, idB: string): Promise<void> {
  const sql = await ensureDb();
  const rows = (await sql`
    SELECT id, sort_order FROM materials WHERE id = ${idA} OR id = ${idB}
  `) as { id: string; sort_order: number }[];
  const a = rows.find((row) => row.id === idA);
  const b = rows.find((row) => row.id === idB);
  if (!a || !b) return;
  await sql`UPDATE materials SET sort_order = ${b.sort_order} WHERE id = ${idA}`;
  await sql`UPDATE materials SET sort_order = ${a.sort_order} WHERE id = ${idB}`;
}
