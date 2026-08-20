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
const INDEX_TONES = [
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
] as const;

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
        "choice-btn flex items-center gap-3 rounded-[1.35rem] border-2 px-3 py-3.5 text-left font-semibold transition-all duration-150 sm:px-4 sm:py-4",
        status === "idle" &&
          "border-transparent bg-surface-elevated text-foreground shadow-[0_6px_0_#ddd4c8] hover:-translate-y-0.5 hover:border-accent/40",
        status === "selected" &&
          "-translate-y-0.5 border-accent bg-accent-soft text-foreground shadow-[0_6px_0_#93c5fd]",
        status === "correct" &&
          "border-correct bg-correct-surface text-correct-foreground shadow-[0_6px_0_#93c5fd]",
        status === "wrong" &&
          "border-wrong bg-wrong-surface text-wrong-foreground shadow-[0_6px_0_#fecaca]",
        disabled &&
          status === "idle" &&
          "cursor-default shadow-none hover:translate-y-0 hover:border-transparent",
      )}
    >
      <span
        className={cn(
          "choice-mark flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
          status === "idle" && INDEX_TONES[index],
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
