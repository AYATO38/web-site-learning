"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { EventShell } from "@/components/next-server-day/event-shell";
import { EventHero } from "@/components/next-server-day/event-hero";
import { QuestionBubble } from "@/components/question-bubble";
import { AnswerPanel } from "@/components/next-server-day/answer-panel";
import { CodeDiffView } from "@/components/next-server-day/code-diff-view";
import { CodeExampleView } from "@/components/next-server-day/code-example-view";
import { cn } from "@/lib/utils";
import { diffBugfixAnswer } from "@/lib/nsd-code-diff";
import {
  DIFFICULTY_LABELS,
  QUESTION_KIND_LABELS,
  type Difficulty,
  type NextServerDayQuestion,
  type QuestionKind,
  type StoredQuestion,
} from "@/lib/next-server-day";
import {
  canSubmitDraft,
  gradeAnswer,
  initialDraft,
  type AnswerDraft,
} from "@/lib/nsd-grade";
import { QUESTION_KINDS, validateQuestionInput } from "@/lib/nsd-question-validate";
import {
  blankCountOf,
  buildQuestion,
  emptyForm,
  formFromQuestion,
  resizeBlankAccepted,
  switchFormKind,
  type ExpectedType,
  type QuestionFormState,
  type TestFormRow,
} from "@/lib/nsd-question-form";
import {
  createQuestion,
  deleteQuestionRequest,
  fetchQuestionsList,
  swapQuestionOrder,
  updateQuestion,
} from "@/lib/nsd-questions-client";
import { fetchMe } from "@/lib/auth/client";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const CATEGORIES = ["HTML", "CSS", "JS", "React"] as const;
const LANGUAGES = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JavaScript" },
] as const;

const fieldClass =
  "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-accent";
const codeFieldClass =
  "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 font-mono text-sm font-semibold text-foreground outline-none focus:border-accent";

export default function NextServerDayAdminPage() {
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchMe().catch(() => null), fetchQuestionsList()])
      .then(([, list]) => {
        setQuestions(list.questions);
        setCanEdit(list.canEdit);
      })
      .catch(() => {
        setCanEdit(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const validation = useMemo(() => {
    if (!form) return { ok: false as const, error: "" };
    return validateQuestionInput(buildQuestion(form));
  }, [form]);

  function startNew(kind: QuestionKind, difficulty: Difficulty) {
    setEditingId(null);
    setForm(emptyForm(kind, difficulty));
    setError(null);
    setMode("edit");
  }

  function startEdit(question: StoredQuestion) {
    setEditingId(question.id);
    setForm(formFromQuestion(question));
    setError(null);
    setMode("edit");
  }

  async function handleSave() {
    if (!form || !validation.ok) {
      setError(validation.ok ? null : validation.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const stored = editingId
        ? await updateQuestion(editingId, validation.question)
        : await createQuestion(validation.question);
      setQuestions((prev) => {
        const index = prev.findIndex((q) => q.id === stored.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = stored;
          return next;
        }
        return [...prev, stored];
      });
      setMode("list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存できませんでした");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("この問題を削除します。よろしいですか？")) return;
    setError(null);
    try {
      await deleteQuestionRequest(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (editingId === id) setMode("list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除できませんでした");
    }
  }

  async function handleMove(question: StoredQuestion, direction: -1 | 1) {
    const group = questions
      .filter((q) => q.difficulty === question.difficulty)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = group.findIndex((q) => q.id === question.id);
    const swapWith = group[index + direction];
    if (!swapWith) return;
    setError(null);
    try {
      await swapQuestionOrder(question.id, swapWith.id);
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === question.id) return { ...q, sortOrder: swapWith.sortOrder };
          if (q.id === swapWith.id) return { ...q, sortOrder: question.sortOrder };
          return q;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "並び替えできませんでした");
    }
  }

  if (loading) {
    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4">
          <p className="text-sm font-semibold text-muted-foreground">読み込み中...</p>
        </div>
      </EventShell>
    );
  }

  if (!canEdit) {
    return (
      <EventShell>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="size-7" />
          </span>
          <p className="mt-4 text-lg font-black tracking-tight">
            この機能を使う権限がありません
          </p>
          <Link href="/next-server-day" className="mt-4 text-sm font-bold text-accent">
            次サバDAYに戻る
          </Link>
        </div>
      </EventShell>
    );
  }

  return (
    <EventShell>
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col px-4 pb-8 pt-8">
        <EventHero
          backHref="/next-server-day"
          title="問題管理"
          subtitle="次サバDAYの問題と解説を追加・編集できます。保存すると次の対戦からすぐ反映されます。"
        />

        {mode === "list" || !form ? (
          <QuestionList
            questions={questions}
            error={error}
            onNew={startNew}
            onEdit={startEdit}
            onDelete={(id) => void handleDelete(id)}
            onMove={(question, direction) => void handleMove(question, direction)}
          />
        ) : (
          <QuestionEditor
            form={form}
            onChange={setForm}
            validation={validation}
            saving={saving}
            error={error}
            isNew={editingId === null}
            onSave={() => void handleSave()}
            onCancel={() => {
              setMode("list");
              setError(null);
            }}
            onDelete={editingId ? () => void handleDelete(editingId) : undefined}
          />
        )}
      </div>
    </EventShell>
  );
}

function QuestionList({
  questions,
  error,
  onNew,
  onEdit,
  onDelete,
  onMove,
}: {
  questions: StoredQuestion[];
  error: string | null;
  onNew: (kind: QuestionKind, difficulty: Difficulty) => void;
  onEdit: (question: StoredQuestion) => void;
  onDelete: (id: string) => void;
  onMove: (question: StoredQuestion, direction: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm font-semibold text-wrong">{error}</p> : null}

      {DIFFICULTIES.map((difficulty) => {
        const group = questions
          .filter((q) => q.difficulty === difficulty)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <section key={difficulty} className="event-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-en">{DIFFICULTY_LABELS[difficulty].desc}</p>
                <h2 className="text-base font-bold">
                  {DIFFICULTY_LABELS[difficulty].label} · {group.length}問
                </h2>
              </div>
            </div>

            <ul className="mt-3 flex flex-col gap-2">
              {group.map((question, index) => (
                <li
                  key={question.id}
                  className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5"
                >
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => onMove(question, -1)}
                      disabled={index === 0}
                      aria-label="上へ"
                      className="text-muted-foreground disabled:opacity-25"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(question, 1)}
                      disabled={index === group.length - 1}
                      aria-label="下へ"
                      className="text-muted-foreground disabled:opacity-25"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-accent">
                        {QUESTION_KIND_LABELS[question.kind]}
                      </span>
                      <span>{question.category}</span>
                      <span>· {question.xp} XP</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold">
                      {question.prompt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEdit(question)}
                    aria-label="編集"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(question.id)}
                    aria-label="削除"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-wrong"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
              {group.length === 0 ? (
                <li className="rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  まだ問題がありません
                </li>
              ) : null}
            </ul>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Plus className="size-3.5" />
                追加:
              </span>
              {QUESTION_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onNew(kind, difficulty)}
                  className="rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-bold text-foreground"
                >
                  {QUESTION_KIND_LABELS[kind]}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** A labeled, reorderable list of plain-text rows — no brackets or commas. */
function StringListField({
  label,
  hint,
  items,
  onChange,
  placeholder,
  reorderable,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  reorderable?: boolean;
}) {
  function update(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  return (
    <div>
      <p className="text-sm font-bold text-foreground">{label}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2 flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {reorderable ? (
              <span className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="上へ"
                  className="text-muted-foreground disabled:opacity-25"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="下へ"
                  className="text-muted-foreground disabled:opacity-25"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </span>
            ) : null}
            <input
              type="text"
              value={item}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              className={cn(fieldClass, "flex-1")}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="この行を削除"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-wrong"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground"
      >
        <Plus className="size-3.5" />
        追加
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function QuestionEditor({
  form,
  onChange,
  validation,
  saving,
  error,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  form: QuestionFormState;
  onChange: (form: QuestionFormState) => void;
  validation: ReturnType<typeof validateQuestionInput>;
  saving: boolean;
  error: string | null;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  function patch(fields: Partial<QuestionFormState>) {
    onChange({ ...form, ...fields });
  }

  const previewQuestion = validation.ok ? validation.question : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{isNew ? "新しい問題を追加" : "問題を編集"}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-muted-foreground"
        >
          一覧に戻る
        </button>
      </div>

      <section className="event-card flex flex-col gap-4 rounded-2xl p-4">
        <p className="section-en">Basics</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="難易度">
            <select
              value={form.difficulty}
              onChange={(event) =>
                patch({ difficulty: event.target.value as Difficulty })
              }
              className={fieldClass}
            >
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {DIFFICULTY_LABELS[difficulty].label}（{DIFFICULTY_LABELS[difficulty].desc}）
                </option>
              ))}
            </select>
          </Field>
          <Field label="カテゴリ">
            <select
              value={form.category}
              onChange={(event) =>
                patch({ category: event.target.value as QuestionFormState["category"] })
              }
              className={fieldClass}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="種類">
            <select
              value={form.kind}
              onChange={(event) =>
                onChange(switchFormKind(form, event.target.value as QuestionKind))
              }
              className={fieldClass}
            >
              {QUESTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {QUESTION_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="XP（正解時の獲得ポイント）">
            <input
              type="number"
              min={1}
              value={form.xp}
              onChange={(event) => patch({ xp: event.target.value })}
              className={fieldClass}
            />
          </Field>
        </div>
        <Field label="id（保存後は変更できません）">
          <input
            type="text"
            value={form.id}
            disabled={!isNew}
            onChange={(event) => patch({ id: event.target.value })}
            placeholder="半角小文字・数字・ハイフン"
            className={cn(fieldClass, !isNew && "opacity-60")}
          />
        </Field>
      </section>

      <section className="event-card flex flex-col gap-4 rounded-2xl p-4">
        <p className="section-en">Question</p>
        <Field label="問題文">
          <textarea
            value={form.prompt}
            onChange={(event) => patch({ prompt: event.target.value })}
            rows={3}
            className={fieldClass}
          />
        </Field>
        <Field label="問題に添えるコード（任意）">
          <textarea
            value={form.code}
            onChange={(event) => patch({ code: event.target.value })}
            rows={3}
            spellCheck={false}
            className={codeFieldClass}
          />
        </Field>
      </section>

      <section className="event-card flex flex-col gap-4 rounded-2xl p-4">
        <p className="section-en">{QUESTION_KIND_LABELS[form.kind]}</p>
        <KindFields form={form} onChange={onChange} />
      </section>

      <section className="event-card flex flex-col gap-4 rounded-2xl p-4">
        <p className="section-en">Explanation</p>
        <Field label="解説">
          <textarea
            value={form.explanation}
            onChange={(event) => patch({ explanation: event.target.value })}
            rows={3}
            className={fieldClass}
          />
        </Field>
      </section>

      <section className="event-card rounded-2xl p-4">
        <p
          className={cn(
            "text-sm font-bold",
            validation.ok ? "text-accent" : "text-wrong",
          )}
        >
          {validation.ok ? "✓ 保存できます" : validation.error}
        </p>
        {error ? <p className="mt-1 text-sm font-semibold text-wrong">{error}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!validation.ok || saving}
            className={cn(
              "flex-1 rounded-full py-3 text-base font-bold",
              validation.ok && !saving
                ? "event-cta"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-wrong/30 bg-wrong-surface px-5 py-3 text-sm font-bold text-wrong"
            >
              削除
            </button>
          ) : null}
        </div>
      </section>

      {previewQuestion ? (
        <section className="event-card rounded-2xl p-4">
          <p className="section-en">Preview</p>
          <h3 className="text-base font-bold">プレビュー</h3>
          <QuestionPreview
            key={`${previewQuestion.kind}:${previewQuestion.id}`}
            question={previewQuestion}
          />
        </section>
      ) : null}
    </div>
  );
}

function KindFields({
  form,
  onChange,
}: {
  form: QuestionFormState;
  onChange: (form: QuestionFormState) => void;
}) {
  function patch(fields: Partial<QuestionFormState>) {
    onChange({ ...form, ...fields });
  }

  if (form.kind === "choice") {
    return (
      <div>
        <p className="text-sm font-bold text-foreground">
          選択肢（○を正解につけてください）
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {form.choices.map((choice, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="answerIndex"
                checked={form.answerIndex === index}
                onChange={() => patch({ answerIndex: index })}
                aria-label={`選択肢${index + 1}を正解にする`}
                className="size-5 shrink-0 accent-accent"
              />
              <input
                type="text"
                value={choice}
                onChange={(event) => {
                  const next = [...form.choices];
                  next[index] = event.target.value;
                  patch({ choices: next });
                }}
                placeholder={`選択肢${index + 1}`}
                className={cn(fieldClass, "flex-1")}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (form.kind === "blank") {
    const blankCount = blankCountOf(form.template);
    return (
      <div className="flex flex-col gap-4">
        <Field label="テンプレート">
          <>
            <p className="text-xs text-muted-foreground">
              空欄にしたい部分に ___（アンダースコア3つ）を入れてください
            </p>
            <textarea
              value={form.template}
              onChange={(event) => {
                const template = event.target.value;
                patch({
                  template,
                  blankAccepted: resizeBlankAccepted(
                    form.blankAccepted,
                    blankCountOf(template),
                  ),
                });
              }}
              rows={3}
              className={fieldClass}
            />
          </>
        </Field>
        {blankCount === 0 ? (
          <p className="text-xs text-muted-foreground">
            テンプレートに ___ を入れると、空欄ごとの正解入力欄が出てきます
          </p>
        ) : (
          Array.from({ length: blankCount }, (_, index) => (
            <StringListField
              key={index}
              label={`空欄${index + 1}の正解候補`}
              hint="どれか1つに一致すれば正解になります"
              items={form.blankAccepted[index] ?? []}
              placeholder="正解の文字列"
              onChange={(items) => {
                const next = resizeBlankAccepted(form.blankAccepted, blankCount);
                next[index] = items;
                patch({ blankAccepted: next });
              }}
            />
          ))
        )}
      </div>
    );
  }

  if (form.kind === "order") {
    return (
      <StringListField
        label="正しい順に並べた項目"
        hint="上から順が正解の並びです。矢印で並び替えられます"
        items={form.items}
        placeholder="項目"
        reorderable
        onChange={(items) => patch({ items })}
      />
    );
  }

  // bugfix / code
  return (
    <div className="flex flex-col gap-4">
      <Field label={form.kind === "bugfix" ? "直す前のコード" : "書き始めのコード（空でもOK）"}>
        <textarea
          value={form.starter}
          onChange={(event) => patch({ starter: event.target.value })}
          rows={6}
          spellCheck={false}
          className={codeFieldClass}
        />
      </Field>
      {form.kind === "bugfix" ? (
        <Field label="正解のコード全体">
          <>
            <p className="text-xs text-muted-foreground">
              これと一致すれば自動で正解になります。回答が間違っていたとき、この内容と見比べて赤字・緑字で違いを表示します
            </p>
            <textarea
              value={form.solution}
              onChange={(event) => patch({ solution: event.target.value })}
              rows={6}
              spellCheck={false}
              className={codeFieldClass}
            />
          </>
        </Field>
      ) : null}
      {form.kind === "code" ? (
        <Field label="解答例（コード全体）">
          <>
            <p className="text-xs text-muted-foreground">
              これと一致すれば自動で正解になります。回答した後、正解・不正解にかかわらず参考としてこの内容を表示します（正誤の色分けはしません）
            </p>
            <textarea
              value={form.example}
              onChange={(event) => patch({ example: event.target.value })}
              rows={6}
              spellCheck={false}
              className={codeFieldClass}
            />
          </>
        </Field>
      ) : null}
      <Field label="言語">
        <select
          value={form.language}
          onChange={(event) =>
            patch({ language: event.target.value as QuestionFormState["language"] })
          }
          className={fieldClass}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
      </Field>
      <StringListField
        label="これと完全に一致すれば正解（任意）"
        hint="書き方のゆれを無視した完全一致チェックです"
        items={form.accepted}
        placeholder="完全一致する正解"
        onChange={(items) => patch({ accepted: items })}
      />
      <StringListField
        label="含んでいれば正解の条件（任意）"
        items={form.mustInclude}
        placeholder="含むべき文字列"
        onChange={(items) => patch({ mustInclude: items })}
      />
      <StringListField
        label="含むべき Tailwind クラス（任意）"
        hint="クラス名として独立しているかまで見て判定します"
        items={form.mustIncludeClasses}
        placeholder="例: bg-blue-500"
        onChange={(items) => patch({ mustIncludeClasses: items })}
      />
      <StringListField
        label="この順番で含むべき文字列（任意）"
        items={form.mustIncludeOrdered}
        placeholder="例: <h1>"
        onChange={(items) => patch({ mustIncludeOrdered: items })}
      />
      <StringListField
        label="含んではいけない文字列（任意）"
        items={form.mustNotInclude}
        placeholder="含んではいけない文字列"
        onChange={(items) => patch({ mustNotInclude: items })}
      />
      {form.kind === "code" ? (
        <TestsField tests={form.tests} onChange={(tests) => patch({ tests })} />
      ) : null}
    </div>
  );
}

function TestsField({
  tests,
  onChange,
}: {
  tests: TestFormRow[];
  onChange: (tests: TestFormRow[]) => void;
}) {
  function update(index: number, patch: Partial<TestFormRow>) {
    const next = [...tests];
    next[index] = { ...next[index]!, ...patch };
    onChange(next);
  }

  return (
    <div>
      <p className="text-sm font-bold text-foreground">自動採点テスト（任意）</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        書いたコードを実際に動かして、呼び出し結果が期待する値と一致するか確認します
      </p>
      <div className="mt-2 flex flex-col gap-3">
        {tests.map((test, index) => (
          <div key={index} className="rounded-xl border border-border bg-surface-elevated p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={test.call}
                onChange={(event) => update(index, { call: event.target.value })}
                placeholder="呼び出し 例: double(2)"
                className={cn(codeFieldClass, "flex-1")}
              />
              <button
                type="button"
                onClick={() => onChange(tests.filter((_, i) => i !== index))}
                aria-label="このテストを削除"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-wrong"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">期待する値:</span>
              <select
                value={test.expectedType}
                onChange={(event) =>
                  update(index, { expectedType: event.target.value as ExpectedType })
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold"
              >
                <option value="number">数値</option>
                <option value="string">文字列</option>
                <option value="boolean">真偽値</option>
                <option value="null">null</option>
              </select>
              {test.expectedType === "boolean" ? (
                <select
                  value={test.expectedValue}
                  onChange={(event) => update(index, { expectedValue: event.target.value })}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : test.expectedType === "null" ? null : (
                <input
                  type="text"
                  value={test.expectedValue}
                  onChange={(event) => update(index, { expectedValue: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...tests, { call: "", expectedType: "number", expectedValue: "" }])
        }
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-foreground"
      >
        <Plus className="size-3.5" />
        テストを追加
      </button>
    </div>
  );
}

function QuestionPreview({ question }: { question: NextServerDayQuestion }) {
  // Keyed by `${kind}:${id}` at the call site, so a genuinely different
  // question shape remounts this (fresh draft) instead of needing an effect;
  // tweaking prompt/explanation text alone doesn't wipe an in-progress
  // test answer.
  const [draft, setDraft] = useState<AnswerDraft>(() => initialDraft(question));
  const [graded, setGraded] = useState<boolean | null>(null);
  const diff =
    graded === false && question.kind === "bugfix" && draft.kind === "text"
      ? diffBugfixAnswer(question.starter, question.solution, draft.value)
      : null;

  return (
    <div className="mt-3">
      <QuestionBubble prompt={question.prompt} code={question.code} />
      <AnswerPanel
        question={question}
        draft={draft}
        phase={graded === null ? "answering" : "standings"}
        onChange={setDraft}
      />
      {graded === null ? (
        <button
          type="button"
          onClick={() => setGraded(gradeAnswer(question, draft))}
          disabled={!canSubmitDraft(question, draft)}
          className={cn(
            "mt-4 w-full rounded-full py-3 text-sm font-bold",
            canSubmitDraft(question, draft)
              ? "event-cta"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          採点してみる
        </button>
      ) : (
        <div
          className={cn(
            "mt-4 rounded-xl border px-3 py-2.5 text-sm font-semibold",
            graded
              ? "border-correct/30 bg-correct-surface text-accent"
              : "border-wrong/30 bg-wrong-surface text-wrong",
          )}
        >
          <p className="font-extrabold">
            {graded ? "正解と判定されました" : "不正解と判定されました"}
          </p>
          <p className="mt-1 text-foreground">
            <span className="font-extrabold">解説: </span>
            {question.explanation}
          </p>
          {diff ? <CodeDiffView diff={diff} /> : null}
          {question.kind === "code" ? (
            <>
              <p className="mt-2 text-xs font-extrabold">解答例</p>
              <CodeExampleView code={question.example} />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDraft(initialDraft(question));
              setGraded(null);
            }}
            className="mt-2 text-xs font-bold text-accent"
          >
            もう一度試す
          </button>
        </div>
      )}
    </div>
  );
}
