"use client";

import { MascotSvg } from "@/components/home/mascot-svg";
import { cn } from "@/lib/utils";
import type { MascotOutfit } from "@/lib/mascot";

const SIZE_BOX = {
  sm: "size-9 text-sm",
  md: "size-12 text-base",
  lg: "size-16 text-xl",
} as const;

/**
 * The account's dress-up mascot shown as a round head-and-shoulders avatar. The
 * mascot art is a full body, so it is scaled to the width and anchored near the
 * top; the round frame crops the rest. Players who never opened the dress-up
 * screen fall back to the first character of their name.
 */
export function PlayerAvatar({
  outfit,
  name,
  size = "sm",
  className,
}: {
  outfit: MascotOutfit | null | undefined;
  name: string;
  size?: keyof typeof SIZE_BOX;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-accent-soft to-white ring-2 ring-accent/15",
        SIZE_BOX[size],
        className,
      )}
    >
      {outfit ? (
        <span
          className="pointer-events-none absolute inset-x-0 top-[8%] mx-auto w-[92%]"
          style={{ aspectRatio: "200 / 248" }}
        >
          <MascotSvg outfit={outfit} view="front" />
        </span>
      ) : (
        <span className="font-extrabold text-accent">
          {name.trim().slice(0, 1) || "?"}
        </span>
      )}
    </span>
  );
}
