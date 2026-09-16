"use client";

import { useEffect, useRef } from "react";
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
  // Armed whenever the code isn't complete yet; firing auto-submit disarms
  // it, and backspacing below 4 characters re-arms it for the next attempt —
  // so a completed code submits itself (one less tap on a phone) without
  // ever re-firing on its own for an already-tried code.
  const armedRef = useRef(true);

  function apply(next: string) {
    onChange(normalizeRoomCode(next));
  }

  function focusAtEnd(target: HTMLInputElement) {
    // The 4 boxes are purely visual; this single input is what actually
    // holds the value, so wherever on the row someone taps, editing should
    // still predictably continue (or backspace) from the end rather than
    // landing at a caret position that doesn't line up with any box.
    const end = target.value.length;
    target.setSelectionRange(end, end);
  }

  useEffect(() => {
    if (code.length < ROOM_CODE_LENGTH) {
      armedRef.current = true;
      return;
    }
    if (disabled || !armedRef.current) return;
    armedRef.current = false;
    onSubmit?.();
  }, [code, disabled, onSubmit]);

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
        autoFocus
        aria-label="部屋コード 4文字"
        maxLength={ROOM_CODE_LENGTH * 2}
        value={code}
        disabled={disabled}
        onChange={(event) => apply(event.target.value)}
        onFocus={(event) => focusAtEnd(event.currentTarget)}
        onClick={(event) => focusAtEnd(event.currentTarget)}
        onPaste={(event) => {
          event.preventDefault();
          apply(event.clipboardData.getData("text"));
        }}
        className="absolute inset-0 z-10 cursor-text bg-transparent text-[16px] text-transparent caret-transparent outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
