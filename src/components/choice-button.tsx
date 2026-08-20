import { cn } from "@/lib/utils";

type Status = "idle" | "selected" | "correct" | "wrong";

type ChoiceButtonProps = {
  label: string;
  index: number;
  status: Status;
  disabled?: boolean;
  onSelect: () => void;
};

const INDEX_LABELS = ["A", "B", "C", "D"] as const;

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
      data-status={status}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-3.5 text-left font-semibold transition-all duration-150 sm:px-4 sm:py-4",
        status === "idle" &&
          "border-border bg-surface-elevated text-foreground shadow-[0_16px_40px_rgba(23,23,23,0.04)] hover:-translate-y-0.5 hover:border-accent/40",
        status === "selected" &&
          "-translate-y-0.5 border-accent bg-accent-soft text-foreground shadow-[0_4px_0_#1e7ae6]",
        status === "correct" &&
          "border-accent bg-accent-soft text-accent shadow-[0_4px_0_#1e7ae6]",
        status === "wrong" &&
          "border-wrong bg-wrong-surface text-wrong-foreground shadow-[0_4px_0_#fecaca]",
        disabled &&
          status === "idle" &&
          "cursor-default shadow-none hover:translate-y-0 hover:border-border",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
          status === "idle" && "bg-muted text-muted-foreground",
          status === "selected" && "bg-accent text-white",
          status === "correct" && "bg-accent text-white",
          status === "wrong" && "bg-wrong text-white",
        )}
      >
        {INDEX_LABELS[index]}
      </span>
      <span className="text-sm leading-snug sm:text-base">{label}</span>
    </button>
  );
}
