"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { ChoiceButton } from "@/components/choice-button";
import { cn } from "@/lib/utils";
import type { NextServerDayQuestion } from "@/lib/next-server-day";
import type { AnswerDraft } from "@/lib/nsd-grade";

const editorClass =
  "w-full rounded-xl border border-border bg-muted px-4 py-3 font-mono text-sm font-semibold text-foreground outline-none focus:border-accent";

export function AnswerPanel({
  question,
  draft,
  phase,
  onChange,
}: {
  question: NextServerDayQuestion;
  draft: AnswerDraft;
  phase: "answering" | "correct" | "wrong";
  onChange: (draft: AnswerDraft) => void;
}) {
  const locked = phase !== "answering";

  if (question.kind === "choice" && draft.kind === "choice") {
    return (
      <div className="mt-6 grid gap-3">
        {question.choices.map((choice, index) => {
          let status: "idle" | "selected" | "correct" | "wrong" = "idle";
          if (phase === "answering") {
            status = draft.index === index ? "selected" : "idle";
          } else if (index === question.answerIndex) {
            status = "correct";
          } else if (index === draft.index) {
            status = "wrong";
          }
          return (
            <ChoiceButton
              key={choice}
              label={choice}
              index={index}
              status={status}
              disabled={locked}
              onSelect={() => onChange({ kind: "choice", index })}
            />
          );
        })}
      </div>
    );
  }

  if (question.kind === "blank" && draft.kind === "text") {
    const parts = question.template.split("___");
    return (
      <div className="mt-6 rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="font-mono text-sm font-semibold leading-loose">
          {parts[0]}
          <input
            type="text"
            value={draft.value}
            disabled={locked}
            onChange={(event) =>
              onChange({ kind: "text", value: event.target.value })
            }
            aria-label="穴埋めの答え"
            className="mx-1 inline-block w-40 rounded-lg border border-accent/40 bg-accent-soft px-2 py-1 text-center font-mono text-sm font-bold text-accent outline-none focus:border-accent disabled:opacity-70"
          />
          {parts.slice(1).join("___")}
        </p>
      </div>
    );
  }

  if (question.kind === "order" && draft.kind === "order") {
    return (
      <OrderList
        items={draft.items}
        locked={locked}
        phase={phase}
        onReorder={(items) => onChange({ kind: "order", items })}
      />
    );
  }

  if (
    (question.kind === "bugfix" || question.kind === "code") &&
    draft.kind === "text"
  ) {
    return (
      <div className="mt-6">
        <label className="mb-2 block text-xs font-bold text-muted-foreground">
          {question.kind === "bugfix"
            ? "壊れているコードを直す"
            : "お題どおりにコードを書く"}
        </label>
        <textarea
          value={draft.value}
          disabled={locked}
          onChange={(event) =>
            onChange({ kind: "text", value: event.target.value })
          }
          spellCheck={false}
          rows={8}
          className={editorClass}
        />
      </div>
    );
  }

  return null;
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function OrderList({
  items,
  locked,
  phase,
  onReorder,
}: {
  items: string[];
  locked: boolean;
  phase: "answering" | "correct" | "wrong";
  onReorder: (items: string[]) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);

  itemsRef.current = items;
  onReorderRef.current = onReorder;
  itemRefs.current.length = items.length;

  useEffect(() => {
    if (draggingIndex === null) return;

    function hitIndex(clientY: number): number | null {
      const nodes = itemRefs.current;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;
        const box = node.getBoundingClientRect();
        if (clientY >= box.top && clientY <= box.bottom) return i;
      }
      return null;
    }

    function onMove(event: PointerEvent) {
      const from = dragIndexRef.current;
      if (from === null) return;
      const over = hitIndex(event.clientY);
      if (over === null || over === from) return;
      onReorderRef.current(arrayMove(itemsRef.current, from, over));
      dragIndexRef.current = over;
      setDraggingIndex(over);
    }

    function onUp() {
      dragIndexRef.current = null;
      setDraggingIndex(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [draggingIndex]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    onReorder(arrayMove(items, index, target));
  }

  function startDrag(index: number, event: React.PointerEvent) {
    if (locked) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    dragIndexRef.current = index;
    setDraggingIndex(index);
  }

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-bold text-muted-foreground">
        ドラッグするか、矢印で並べ替えてください
      </p>
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={item}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            onPointerDown={(event) => startDrag(index, event)}
            className={cn(
              "flex touch-none items-center gap-2 rounded-2xl border bg-surface-elevated px-3 py-2 select-none",
              locked ? "cursor-default" : "cursor-grab",
              draggingIndex === index &&
                "cursor-grabbing border-accent bg-accent-soft shadow-lg",
              draggingIndex !== index &&
                (phase === "correct"
                  ? "border-accent/40"
                  : phase === "wrong"
                    ? "border-wrong/30"
                    : "border-border"),
            )}
          >
            <GripVertical
              className={cn(
                "size-4 shrink-0",
                locked ? "text-muted-foreground/40" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-black text-muted-foreground">
              {index + 1}
            </span>
            <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm font-semibold">
              {item}
            </pre>
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                disabled={locked || index === 0}
                onClick={() => move(index, -1)}
                className="rounded-md p-1 text-muted-foreground disabled:opacity-30"
                aria-label="上へ"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                disabled={locked || index === items.length - 1}
                onClick={() => move(index, 1)}
                className="rounded-md p-1 text-muted-foreground disabled:opacity-30"
                aria-label="下へ"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
