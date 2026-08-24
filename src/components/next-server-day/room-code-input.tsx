"use client";

import { cn } from "@/lib/utils";
import { ROOM_CODE_LENGTH, normalizeRoomCode } from "@/lib/nsd-room";

export function RoomCodeInput({
  value,
  onChange,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  onSubmit?: () => void;
}) {
  const code = normalizeRoomCode(value);

  function apply(next: string) {
    onChange(normalizeRoomCode(next));
  }

  return (
    <div className="relative mx-auto w-fit">
      <div className="pointer-events-none flex justify-center gap-2" aria-hidden>
        {Array.from({ length: ROOM_CODE_LENGTH }, (_, index) => {
          const active =
            !disabled &&
            (code.length === index ||
              (code.length === ROOM_CODE_LENGTH &&
                index === ROOM_CODE_LENGTH - 1));
          return (
            <div
              key={index}
              className={cn(
                "flex size-14 items-center justify-center rounded-xl border bg-surface-elevated font-mono text-2xl font-extrabold text-accent sm:size-16 sm:text-3xl",
                code[index] ? "border-accent/50" : "border-border",
                active && "border-accent ring-2 ring-accent/25",
              )}
            >
              {code[index] ?? ""}
            </div>
          );
        })}
      </div>
      <input
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        lang="en"
        enterKeyHint="go"
        aria-label="部屋コード 4文字"
        maxLength={ROOM_CODE_LENGTH * 2}
        value={code}
        disabled={disabled}
        onChange={(event) => apply(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          apply(event.clipboardData.getData("text"));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && code.length === ROOM_CODE_LENGTH) {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        className="absolute inset-0 z-10 cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
