import type { LessonCategory } from "@/lib/lessons";
import { materialCategories, type Material } from "@/lib/materials";

export type MaterialValidation =
  | { ok: true; material: Material }
  | { ok: false; error: string };

const ID_PATTERN = /^[a-z0-9-]{1,40}$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateMaterialInput(input: unknown): MaterialValidation {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const id = text(data.id);
  if (!ID_PATTERN.test(id)) {
    return { ok: false, error: "id は英小文字・数字・ハイフンだけで、40文字以内にしてください" };
  }

  const title = text(data.title);
  if (!title || title.length > 60) {
    return { ok: false, error: "タイトルは1〜60文字で入力してください" };
  }

  const description = text(data.description);
  if (description.length > 200) {
    return { ok: false, error: "説明は200文字以内で入力してください" };
  }

  const url = text(data.url);
  if (!/^https:\/\/\S+$/.test(url)) {
    return { ok: false, error: "資料URLは https:// で始まるURLにしてください" };
  }

  const category = text(data.category) as LessonCategory;
  if (!materialCategories.includes(category)) {
    return { ok: false, error: "カテゴリが正しくありません" };
  }

  return { ok: true, material: { id, title, description, url, category } };
}
