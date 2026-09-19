"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  phase: "answering" | "waiting" | "standings";
  onChange: (draft: AnswerDraft) => void;
}) {
  const locked = phase !== "answering";

  if (question.kind === "choice" && draft.kind === "choice") {
    return (
      <div className="mt-6 grid gap-3">
        {question.choices.map((choice, index) => {
          const status: "idle" | "selected" =
            draft.index === index ? "selected" : "idle";
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

  if (question.kind === "blank" && draft.kind === "blanks") {
    const parts = question.template.split("___");
    return (
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="whitespace-pre-wrap font-mono text-sm font-semibold leading-loose">
          {parts.map((part, index) => (
            <span key={index}>
              {index > 0 ? (
                <input
                  type="text"
                  value={draft.values[index - 1] ?? ""}
                  disabled={locked}
                  onChange={(event) => {
                    const values = [...draft.values];
                    values[index - 1] = event.target.value;
                    onChange({ kind: "blanks", values });
                  }}
                  aria-label={`穴埋め ${index}つ目`}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="mx-1 inline-block min-w-[12rem] w-[13rem] rounded-lg border border-accent/40 bg-accent-soft px-2 py-1 text-center font-mono text-sm font-bold text-accent outline-none focus:border-accent disabled:opacity-70 sm:w-56"
                />
              ) : null}
              {part}
            </span>
          ))}
        </p>
      </div>
    );
  }

  if (question.kind === "order" && draft.kind === "order") {
    return (
      <OrderList
        items={draft.items}
        locked={locked}
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
          rows={Math.min(
            22,
            Math.max(8, (question.starter ?? "").split("\n").length + 1),
          )}
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

const FLIP_MS = 240;
const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function OrderList({
  items,
  locked,
  onReorder,
}: {
  items: string[];
  locked: boolean;
  onReorder: (items: string[]) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const grabOffsetRef = useRef(0);
  const pointerYRef = useRef(0);
  const firstTopsRef = useRef<Map<string, number>>(new Map());
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);

  itemsRef.current = items;
  onReorderRef.current = onReorder;
  itemRefs.current.length = items.length;

  function recordTops() {
    const map = new Map<string, number>();
    itemsRef.current.forEach((item, index) => {
      const node = itemRefs.current[index];
      if (node) map.set(item, node.getBoundingClientRect().top);
    });
    firstTopsRef.current = map;
  }

  function layoutTop(node: HTMLElement) {
    const previous = node.style.transform;
    node.style.transform = "none";
    const top = node.getBoundingClientRect().top;
    node.style.transform = previous;
    return top;
  }

  function followPointer() {
    const index = dragIndexRef.current;
    if (index === null) return;
    const node = itemRefs.current[index];
    if (!node) return;
    const desiredTop = pointerYRef.current - grabOffsetRef.current;
    const dy = desiredTop - layoutTop(node);
    node.style.transition = "none";
    node.style.zIndex = "30";
    node.style.transform = `translateY(${dy}px) scale(1.03)`;
  }

  useLayoutEffect(() => {
    const prev = firstTopsRef.current;
    items.forEach((item, index) => {
      const node = itemRefs.current[index];
      if (!node) return;
      if (dragIndexRef.current === index) {
        followPointer();
        return;
      }
      const firstTop = prev.get(item);
      if (firstTop == null) return;
      const dy = firstTop - node.getBoundingClientRect().top;
      if (Math.abs(dy) < 0.5) return;
      node.style.transition = "none";
      node.style.transform = `translateY(${dy}px)`;
      node.getBoundingClientRect();
      node.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
      node.style.transform = "";
    });
  }, [items]);

  useEffect(() => {
    if (draggingIndex === null) return;

    function hitIndex(clientY: number, from: number): number {
      const nodes = itemRefs.current;
      for (let i = 0; i < nodes.length; i++) {
        if (i === from) continue;
        const node = nodes[i];
        if (!node) continue;
        const box = node.getBoundingClientRect();
        const mid = (box.top + box.bottom) / 2;
        if (i < from && clientY < mid) return i;
        if (i > from && clientY > mid) return i;
      }
      return from;
    }

    function onMove(event: PointerEvent) {
      pointerYRef.current = event.clientY;
      const from = dragIndexRef.current;
      if (from === null) return;
      const over = hitIndex(event.clientY, from);
      if (over !== from) {
        recordTops();
        onReorderRef.current(arrayMove(itemsRef.current, from, over));
        dragIndexRef.current = over;
        setDraggingIndex(over);
      }
      followPointer();
    }

    function onUp() {
      const index = dragIndexRef.current;
      const node = index === null ? null : itemRefs.current[index];
      if (node) {
        node.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
        node.style.transform = "";
        node.style.zIndex = "";
      }
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
    recordTops();
    onReorder(arrayMove(items, index, target));
  }

  function startDrag(index: number, event: React.PointerEvent) {
    if (locked) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const node = itemRefs.current[index];
    const top = node?.getBoundingClientRect().top ?? event.clientY;
    pointerYRef.current = event.clientY;
    grabOffsetRef.current = event.clientY - top;
    dragIndexRef.current = index;
    setDraggingIndex(index);
    followPointer();
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
              "flex touch-none items-center gap-2 rounded-2xl border bg-surface-elevated px-3 py-2 will-change-transform select-none",
              locked ? "cursor-default" : "cursor-grab",
              draggingIndex === index &&
                "cursor-grabbing border-accent bg-accent-soft shadow-xl",
              draggingIndex !== index && "border-border",
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
