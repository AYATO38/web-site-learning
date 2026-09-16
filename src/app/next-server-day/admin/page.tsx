"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { EventShell } from "@/components/next-server-day/event-shell";
import { EventHero } from "@/components/next-server-day/event-hero";
import { QuestionBubble } from "@/components/question-bubble";
import { AnswerPanel } from "@/components/next-server-day/answer-panel";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABELS,
  QUESTION_KIND_LABELS,
  type Difficulty,
  type NextServerDayQuestion,
  type StoredQuestion,
} from "@/lib/next-server-day";
import {
  canSubmitDraft,
  gradeAnswer,
  initialDraft,
  type AnswerDraft,
} from "@/lib/nsd-grade";
import {
  QUESTION_KINDS,
  newQuestionTemplate,
  validateQuestionInput,
} from "@/lib/nsd-question-validate";
import {
  createQuestion,
  deleteQuestionRequest,
  fetchQuestionsList,
  swapQuestionOrder,
  updateQuestion,
} from "@/lib/nsd-questions-client";
import { fetchMe } from "@/lib/auth/client";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export default function NextServerDayAdminPage() {
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
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
    const parsed = tryParseJson(draftText);
    if (parsed === undefined) {
      return { ok: false as const, error: "JSONとして読み取れません（文法エラー）" };
    }
    return validateQuestionInput(parsed);
  }, [draftText]);

  function startNew(kind: (typeof QUESTION_KINDS)[number], difficulty: Difficulty) {
    setEditingId(null);
    setDraftText(newQuestionTemplate(kind, difficulty));
    setError(null);
    setMode("edit");
  }

  function startEdit(question: StoredQuestion) {
    const content: Record<string, unknown> = { ...question };
    delete content.sortOrder;
    delete content.updatedAt;
    setEditingId(question.id);
    setDraftText(JSON.stringify(content, null, 2));
    setError(null);
    setMode("edit");
  }

  async function handleSave() {
    if (!validation.ok) {
      setError(validation.error);
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

        {mode === "list" ? (
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
            draftText={draftText}
            onChangeText={setDraftText}
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
  onNew: (kind: (typeof QUESTION_KINDS)[number], difficulty: Difficulty) => void;
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

function QuestionEditor({
  draftText,
  onChangeText,
  validation,
  saving,
  error,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  draftText: string;
  onChangeText: (value: string) => void;
  validation: ReturnType<typeof validateQuestionInput>;
  saving: boolean;
  error: string | null;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="event-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {isNew ? "新しい問題を追加" : "問題を編集"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-muted-foreground"
          >
            一覧に戻る
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          JSONとして編集してください。id は保存後は変更できません。下のプレビューで実際に答えて採点を試せます。
        </p>
        <textarea
          value={draftText}
          onChange={(event) => onChangeText(event.target.value)}
          spellCheck={false}
          rows={Math.min(28, Math.max(14, draftText.split("\n").length + 1))}
          className="mt-3 w-full rounded-xl border border-border bg-muted px-4 py-3 font-mono text-xs font-semibold leading-relaxed text-foreground outline-none focus:border-accent"
        />

        <p
          className={cn(
            "mt-2 text-sm font-bold",
            validation.ok ? "text-accent" : "text-wrong",
          )}
        >
          {validation.ok ? "✓ 保存できます" : validation.error}
        </p>
        {error ? <p className="mt-1 text-sm font-semibold text-wrong">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      {validation.ok ? (
        <section className="event-card rounded-2xl p-4">
          <p className="section-en">Preview</p>
          <h3 className="text-base font-bold">プレビュー</h3>
          <QuestionPreview
            key={`${validation.question.kind}:${validation.question.id}`}
            question={validation.question}
          />
        </section>
      ) : null}
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
          <p className="font-extrabold">{graded ? "正解と判定されました" : "不正解と判定されました"}</p>
          <p className="mt-1 text-foreground">
            <span className="font-extrabold">解説: </span>
            {question.explanation}
          </p>
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
