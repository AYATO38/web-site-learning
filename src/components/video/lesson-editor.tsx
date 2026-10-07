"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { lessonCategories, type Lesson, type LessonCategory } from "@/lib/lessons";

type Fields = Omit<Lesson, "id">;

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-accent";

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
        placeholder="説明"
        aria-label="説明"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className={inputClass}
          value={value.duration}
          onChange={(event) => onChange({ ...value, duration: event.target.value })}
          placeholder="約12分"
          aria-label="時間"
        />
        <select
          className={inputClass}
          value={value.category}
          onChange={(event) =>
            onChange({ ...value, category: event.target.value as LessonCategory })
          }
          aria-label="カテゴリ"
        >
          {lessonCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <input
        className={inputClass}
        value={value.videoUrl}
        onChange={(event) => onChange({ ...value, videoUrl: event.target.value })}
        placeholder="https://www.youtube.com/embed/..."
        aria-label="動画URL"
      />
    </div>
  );
}

function LessonRow({
  lesson,
  canMoveUp,
  canMoveDown,
  onMove,
  onChanged,
}: {
  lesson: Lesson;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Fields>({
    title: lesson.title,
    description: lesson.description,
    duration: lesson.duration,
    videoUrl: lesson.videoUrl,
    category: lesson.category,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const failure = await send(
      "PUT",
      `/api/lessons/${encodeURIComponent(lesson.id)}`,
      { lesson: { id: lesson.id, ...draft } },
    );
    setBusy(false);
    if (failure) setError(failure);
    else onChanged();
  }

  async function remove() {
    if (!window.confirm(`「${lesson.title}」を削除しますか？`)) return;
    setBusy(true);
    setError(null);
    const failure = await send("DELETE", `/api/lessons/${encodeURIComponent(lesson.id)}`);
    setBusy(false);
    if (failure) setError(failure);
    else onChanged();
  }

  return (
    <li className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{lesson.id}</p>
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

function NewLessonForm({ onChanged }: { onChanged: () => void }) {
  const [id, setId] = useState("");
  const [fields, setFields] = useState<Fields>({
    title: "",
    description: "",
    duration: "",
    videoUrl: "",
    category: lessonCategories[0],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const failure = await send("POST", "/api/lessons", { lesson: { id, ...fields } });
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setId("");
    setFields({ ...fields, title: "", description: "", duration: "", videoUrl: "" });
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <p className="mb-3 text-sm font-bold">新しい動画を追加</p>
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

export function LessonEditor({
  lessons,
  onChanged,
}: {
  lessons: Lesson[];
  onChanged: () => void;
}) {
  async function move(index: number, direction: -1 | 1) {
    const other = lessons[index + direction];
    if (!other) return;
    const failure = await send(
      "PATCH",
      `/api/lessons/${encodeURIComponent(lessons[index].id)}`,
      { swapWith: other.id },
    );
    if (!failure) onChanged();
  }

  return (
    <section className="mt-6 space-y-4">
      <p className="text-sm font-bold text-muted-foreground">講義動画の編集</p>
      <ul className="space-y-4">
        {lessons.map((lesson, index) => (
          <LessonRow
            key={JSON.stringify(lesson)}
            lesson={lesson}
            canMoveUp={index > 0}
            canMoveDown={index < lessons.length - 1}
            onMove={(direction) => void move(index, direction)}
            onChanged={onChanged}
          />
        ))}
      </ul>
      <NewLessonForm onChanged={onChanged} />
    </section>
  );
}
