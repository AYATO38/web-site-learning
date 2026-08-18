"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type CapOption,
  type MascotOutfit,
  type ShirtOption,
  capOptions,
  defaultOutfit,
  loadOutfit,
  saveOutfit,
  shirtOptions,
} from "@/lib/mascot";
import { Shirt, Sparkles } from "lucide-react";

const capColors: Record<Exclude<CapOption, "none">, string> = {
  blue: "#0066ff",
  black: "#18181b",
};

function MascotSvg({ outfit }: { outfit: MascotOutfit }) {
  const shirtColor =
    shirtOptions.find((s) => s.id === outfit.shirt)?.color ?? "#ffffff";

  return (
    <svg
      viewBox="0 0 200 240"
      className="h-full w-full drop-shadow-sm"
      aria-hidden
    >
      {/* Shadow */}
      <ellipse cx="100" cy="225" rx="52" ry="10" fill="#e4e4e7" />

      {/* Legs */}
      <rect x="78" y="175" width="18" height="38" rx="9" fill="#fde68a" />
      <rect x="104" y="175" width="18" height="38" rx="9" fill="#fde68a" />
      <rect x="76" y="205" width="22" height="12" rx="6" fill="#18181b" />
      <rect x="102" y="205" width="22" height="12" rx="6" fill="#18181b" />

      {/* Body / shirt */}
      <path
        d="M62 118 Q100 108 138 118 L145 178 Q100 188 55 178 Z"
        fill={shirtColor}
        stroke="#e4e4e7"
        strokeWidth="2"
      />
      {outfit.shirt === "white" && (
        <circle cx="100" cy="145" r="4" fill="#0066ff" opacity="0.8" />
      )}

      {/* Arms */}
      <ellipse cx="58" cy="140" rx="14" ry="22" fill="#fde68a" />
      <ellipse cx="142" cy="140" rx="14" ry="22" fill="#fde68a" />

      {/* Head */}
      <circle cx="100" cy="88" r="46" fill="#fde68a" />
      <circle cx="84" cy="82" r="6" fill="#18181b" />
      <circle cx="116" cy="82" r="6" fill="#18181b" />
      <circle cx="86" cy="80" r="2" fill="#ffffff" />
      <circle cx="118" cy="80" r="2" fill="#ffffff" />
      <path
        d="M88 98 Q100 108 112 98"
        fill="none"
        stroke="#18181b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="76" cy="94" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="124" cy="94" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />

      {/* Cap */}
      {outfit.cap !== "none" && (
        <>
          <path
            d="M54 72 Q100 38 146 72 L148 82 Q100 62 52 82 Z"
            fill={capColors[outfit.cap]}
          />
          <ellipse
            cx="100"
            cy="82"
            rx="54"
            ry="8"
            fill={capColors[outfit.cap]}
            opacity="0.85"
          />
          <rect
            x="132"
            y="78"
            width="28"
            height="6"
            rx="3"
            fill={capColors[outfit.cap]}
          />
        </>
      )}
    </svg>
  );
}

export function MascotCharacter() {
  const [outfit, setOutfit] = useState<MascotOutfit>(defaultOutfit);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setOutfit(loadOutfit());
  }, []);

  function updateOutfit(patch: Partial<MascotOutfit>) {
    const next = { ...outfit, ...patch };
    setOutfit(next);
    saveOutfit(next);
  }

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "group relative flex size-44 items-center justify-center rounded-full bg-accent-soft transition-all duration-300 sm:size-52",
          "ring-4 ring-accent/15 hover:ring-accent/30 active:scale-95",
          menuOpen && "ring-accent/30",
        )}
        aria-label="キャラクターをカスタマイズ"
        aria-expanded={menuOpen}
      >
        <div className="size-36 transition-transform duration-300 group-hover:scale-105 sm:size-44">
          <MascotSvg outfit={outfit} />
        </div>
        <span className="absolute -bottom-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-md">
          <Sparkles className="mr-1 inline size-3" />
          タップして着せ替え
        </span>
      </button>

      {menuOpen && (
        <div className="glass-card mt-5 w-full max-w-sm rounded-[1.4rem] p-4 transition-all">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <Shirt className="size-4 text-accent" />
            着せ替えメニュー
          </div>

          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                帽子（Cap）
              </legend>
              <div className="flex flex-wrap gap-2">
                {capOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateOutfit({ cap: opt.id })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                      outfit.cap === opt.id
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-muted text-foreground hover:border-accent/40",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                服（T-shirt）
              </legend>
              <div className="flex flex-wrap gap-2">
                {shirtOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateOutfit({ shirt: opt.id as ShirtOption })}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                      outfit.shirt === opt.id
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-muted text-foreground hover:border-accent/40",
                    )}
                  >
                    <span
                      className="size-3 rounded-full border border-border"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
