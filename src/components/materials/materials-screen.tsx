"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  PencilLine,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  materialCategories,
  materialsInCategory,
  type Material,
  type MaterialCategory,
} from "@/lib/materials";

type MaterialsState = { materials: Material[]; canEdit: boolean };
type Fields = Omit<Material, "id">;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-accent";

async function fetchMaterials(): Promise<MaterialsState | null> {
  try {
    const res = await fetch("/api/materials", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MaterialsState;
  } catch {
    return null;
  }
}

async function send(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { error?: unknown };
  return typeof data.error === "string" ? data.error : "保存できませんでした";
}

function MaterialCard({ material }: { material: Material }) {
  return (
    <a
      href={material.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card flex items-center gap-4 rounded-[1.4rem] p-4 transition-transform hover:-translate-y-0.5"
    >
      <span className="shrink-0 rounded-full bg-accent-soft p-3 text-accent">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{material.title}</p>
        {material.description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{material.description}</p>
        ) : null}
      </div>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
    </a>
  );
}

function FieldInputs({
  value,
  onChange,
}: {
  value: Fields;
  onChange: (next: Fields) => void;
}) {
  return (
    <div className="grid gap-2">
      <input
        className={inputClass}
        value={value.title}
        onChange={(event) => onChange({ ...value, title: event.target.value })}
        placeholder="タイトル"
        aria-label="タイトル"
      />
      <textarea
        className={inputClass}
        rows={2}
        value={value.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
        placeholder="説明（なくてもOK）"
        aria-label="説明"
      />
      <select
        className={inputClass}
        value={value.category}
        onChange={(event) =>
          onChange({ ...value, category: event.target.value as MaterialCategory })
        }
        aria-label="カテゴリ"
      >
        {materialCategories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        value={value.url}
        onChange={(event) => onChange({ ...value, url: event.target.value })}
        placeholder="https://docs.google.com/..."
        aria-label="資料URL"
      />
    </div>
  );
}

function MaterialRow({
  material,
  canMoveUp,
  canMoveDown,
  onMove,
  onChanged,
}: {
  material: Material;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Fields>({
    title: material.title,
    description: material.description,
    url: material.url,
    category: material.category,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const path = `/api/materials/${encodeURIComponent(material.id)}`;

  async function save() {
    setBusy(true);
    setError(null);
    const failure = await send("PUT", path, { material: { id: material.id, ...draft } });
    setBusy(false);
    if (failure) setError(failure);
    else onChanged();
  }

  async function remove() {
    if (!window.confirm(`「${material.title}」を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    const failure = await send("DELETE", path);
    setBusy(false);
    if (failure) setError(failure);
    else onChanged();
  }

  return (
    <li className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{material.id}</p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp || busy}
            aria-label="上へ"
            className="rounded-md p-1.5 text-muted-foreground disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canMoveDown || busy}
            aria-label="下へ"
            className="rounded-md p-1.5 text-muted-foreground disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
        </div>
      </div>

      <FieldInputs value={draft} onChange={setDraft} />

      {error ? <p className="mt-3 text-sm font-semibold text-wrong">{error}</p> : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          <Save className="size-4" />
          保存
        </button>
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-wrong disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          削除
        </button>
      </div>
    </li>
  );
}

function NewMaterialForm({ onChanged }: { onChanged: () => void }) {
  const [id, setId] = useState("");
  const [fields, setFields] = useState<Fields>({
    title: "",
    description: "",
    url: "",
    category: materialCategories[0],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const failure = await send("POST", "/api/materials", { material: { id, ...fields } });
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setId("");
    setFields({ ...fields, title: "", description: "", url: "" });
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <p className="mb-3 text-sm font-bold">新しい資料を追加</p>
      <input
        className={`${inputClass} mb-2`}
        value={id}
        onChange={(event) => setId(event.target.value)}
        placeholder="id（英小文字・数字・ハイフン）"
        aria-label="id"
      />
      <FieldInputs value={fields} onChange={setFields} />
      {error ? <p className="mt-3 text-sm font-semibold text-wrong">{error}</p> : null}
      <button
        type="button"
        onClick={() => void add()}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        <Plus className="size-4" />
        追加する
      </button>
    </div>
  );
}

function MaterialEditor({
  materials,
  onChanged,
}: {
  materials: Material[];
  onChanged: () => void;
}) {
  async function move(index: number, direction: -1 | 1) {
    const other = materials[index + direction];
    if (!other) return;
    const failure = await send(
      "PATCH",
      `/api/materials/${encodeURIComponent(materials[index].id)}`,
      { swapWith: other.id },
    );
    if (!failure) onChanged();
  }

  return (
    <section className="mt-6 space-y-4">
      <p className="text-sm font-bold text-muted-foreground">講義資料の編集</p>
      <ul className="space-y-4">
        {materials.map((material, index) => (
          <MaterialRow
            key={JSON.stringify(material)}
            material={material}
            canMoveUp={index > 0}
            canMoveDown={index < materials.length - 1}
            onMove={(direction) => void move(index, direction)}
            onChanged={onChanged}
          />
        ))}
      </ul>
      <NewMaterialForm onChanged={onChanged} />
    </section>
  );
}

export function MaterialsScreen() {
  const [state, setState] = useState<MaterialsState | null>(null);
  const [editing, setEditing] = useState(false);

  const refresh = useCallback(async () => {
    const next = await fetchMaterials();
    if (next) setState(next);
  }, []);

  useEffect(() => {
    void fetchMaterials().then((next) => {
      setState(next ?? { materials: [], canEdit: false });
    });
  }, []);

  const materials = state?.materials ?? [];
  const canEdit = state?.canEdit ?? false;

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-36 pt-8">
      <p className="section-en">Materials</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">講義資料</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        講義で使うスライドや資料です。タップすると別のタブで開きます。
      </p>

      {canEdit ? (
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-bold text-muted-foreground"
        >
          <PencilLine className="size-4" />
          {editing ? "編集を閉じる" : "資料を編集"}
        </button>
      ) : null}

      {canEdit && editing ? (
        <MaterialEditor materials={materials} onChanged={() => void refresh()} />
      ) : null}

      {state === null ? (
        <p className="mt-8 text-sm text-muted-foreground">読み込み中...</p>
      ) : materials.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          講義資料はまだありません。
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {materialCategories.map((category) => {
            const items = materialsInCategory(materials, category);
            if (items.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-3 text-sm font-bold text-muted-foreground">{category}</h2>
                <div className="space-y-3">
                  {items.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
