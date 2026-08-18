"use client";

import { cn } from "@/lib/utils";

type Status = "idle" | "selected" | "correct" | "wrong";

type ChoiceButtonProps = {
  label: string;
  index: number;
  status: Status;
  disabled?: boolean;
  onSelect: () => void;
};

const INDEX_LABELS = ["1", "2", "3", "4"] as const;

export function ChoiceButton({
  label,
  index,
  status,
  disabled,
  onSelect,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-3.5 text-left font-semibold transition-colors duration-150 sm:px-4 sm:py-4",
        status === "idle" &&
          "border-border bg-surface-elevated hover:border-accent/50 hover:bg-accent-soft",
        status === "selected" && "border-accent bg-accent-soft text-foreground",
        status === "correct" &&
          "border-correct bg-correct-surface text-correct-foreground",
        status === "wrong" &&
          "border-wrong bg-wrong-surface text-wrong-foreground",
        disabled &&
          status === "idle" &&
          "cursor-default hover:border-border hover:bg-surface-elevated",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-bold",
          status === "idle" && "bg-muted text-muted-foreground",
          status === "selected" && "bg-accent text-white",
          status === "correct" && "bg-correct text-white",
          status === "wrong" && "bg-wrong text-white",
        )}
      >
        {INDEX_LABELS[index]}
      </span>
      <span className="text-sm leading-snug sm:text-base">{label}</span>
    </button>
  );
}
