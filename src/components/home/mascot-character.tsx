"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  browOptions,
  defaultOutfit,
  eyeOptions,
  glassesOptions,
  hairColors,
  hairStyles,
  hatOptions,
  loadOutfit,
  mouthOptions,
  personalityPresets,
  randomOutfit,
  saveOutfit,
  shirtOptions,
  skinOptions,
  type MascotOutfit,
} from "@/lib/mascot";
import { MascotSvg } from "@/components/home/mascot-svg";
import { Dices, Shirt, Sparkles } from "lucide-react";

function wrapYaw(value: number) {
  return ((value % 360) + 360) % 360;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "relative z-10 cursor-pointer rounded-full border px-2.5 py-1.5 text-xs font-semibold",
        selected
          ? "border-accent bg-accent text-white"
          : "border-border bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function ColorSwatches<T extends { id: string; label: string; color: string }>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T["id"];
  onChange: (id: T["id"]) => void;
}) {
  return (
    <>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-label={opt.label}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange(opt.id)}
          className={cn(
            "size-7 rounded-full border-2",
            value === opt.id ? "border-accent" : "border-border",
          )}
          style={{ backgroundColor: opt.color }}
        />
      ))}
    </>
  );
}

export function MascotCharacter() {
  const [outfit, setOutfit] = useState<MascotOutfit>(defaultOutfit);
  const [menuOpen, setMenuOpen] = useState(false);
  const [yaw, setYaw] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    x: number;
    yaw: number;
    pointerId: number;
  } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    setOutfit(loadOutfit());
  }, []);

  function updateOutfit(patch: Partial<MascotOutfit>) {
    const next = { ...outfit, ...patch };
    setOutfit(next);
    saveOutfit(next);
  }

  function openMenu() {
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setYaw(0);
  }

  function onLookPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragged.current = false;
    drag.current = {
      x: event.clientX,
      yaw,
      pointerId: event.pointerId,
    };
  }

  function onLookPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) < 14 && !dragged.current) return;
    dragged.current = true;
    setDragging(true);
    setYaw(drag.current.yaw + dx * 0.85);
  }

  function onLookPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  function onCharacterClick() {
    if (dragged.current) return;
    openMenu();
  }

  const turn = wrapYaw(yaw);
  const squash = Math.max(0.38, Math.abs(Math.cos((turn * Math.PI) / 180)));
  const showBack = Math.cos((turn * Math.PI) / 180) < 0;

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          "flex w-full flex-col items-center gap-2",
          menuOpen &&
            "sticky top-0 z-20 -mx-5 border-b border-border bg-white/95 px-5 py-3 backdrop-blur-md",
        )}
      >
        <div
          aria-label="キャラクター"
          onPointerDown={onLookPointerDown}
          onPointerMove={onLookPointerMove}
          onPointerUp={onLookPointerUp}
          onPointerCancel={onLookPointerUp}
          onClick={onCharacterClick}
          className="relative z-0 flex size-44 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-accent-soft to-white shadow-sm ring-4 ring-accent/15 sm:size-52"
          style={{ clipPath: "circle(50%)" }}
        >
          <div className={cn("pointer-events-none", !dragging && "mascot-bob")}>
            <div
              className="h-40 w-36 sm:h-48 sm:w-44"
              style={{ transform: `scaleX(${squash})` }}
            >
              <MascotSvg outfit={outfit} view={showBack ? "back" : "front"} />
            </div>
          </div>
        </div>

        {outfit.name.trim() ? (
          <p className="rounded-full bg-muted px-3 py-0.5 text-sm font-bold">
            {outfit.name}
          </p>
        ) : null}

        <div className="relative z-30 flex items-center gap-3">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              if (menuOpen) closeMenu();
              else openMenu();
            }}
            className="min-h-11 cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            aria-expanded={menuOpen}
          >
            <Sparkles className="mr-1 inline size-3.5" />
            {menuOpen ? "閉じる" : "着せ替え"}
          </button>
          {menuOpen ? (
            <button
              type="button"
              onClick={() => setYaw(0)}
              className="cursor-pointer text-xs font-semibold text-accent"
            >
              正面に戻す
            </button>
          ) : null}
        </div>
      </div>

      {menuOpen ? (
        <div className="glass-card relative z-30 mt-4 w-full max-w-sm space-y-4 rounded-[1.4rem] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Shirt className="size-4 text-accent" />
              着せ替え
            </p>
            <button
              type="button"
              onClick={() => updateOutfit(randomOutfit(outfit.name))}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-bold"
            >
              <Dices className="size-3.5" />
              おまかせ
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              ニックネーム
            </span>
            <input
              type="text"
              value={outfit.name}
              maxLength={8}
              placeholder="例: あやと"
              onChange={(event) => updateOutfit({ name: event.target.value })}
              className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm font-semibold outline-none focus:border-accent"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-muted-foreground">
              個性プリセット
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {personalityPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    updateOutfit({ ...preset.outfit, name: outfit.name })
                  }
                  className="rounded-xl border border-border bg-muted px-3 py-2 text-left"
                >
                  <p className="text-sm font-bold">{preset.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="肌">
            <ColorSwatches
              options={skinOptions}
              value={outfit.skin}
              onChange={(skin) => updateOutfit({ skin })}
            />
          </Field>

          <Field label="髪型">
            {hairStyles.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.hair === opt.id}
                onClick={() => updateOutfit({ hair: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
          </Field>

          <Field label="髪色">
            <ColorSwatches
              options={hairColors}
              value={outfit.hairColor}
              onChange={(hairColor) => updateOutfit({ hairColor })}
            />
          </Field>

          <Field label="眉">
            {browOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.brows === opt.id}
                onClick={() => updateOutfit({ brows: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
          </Field>

          <Field label="目">
            {eyeOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.eyes === opt.id}
                onClick={() => updateOutfit({ eyes: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
          </Field>

          <Field label="口">
            {mouthOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.mouth === opt.id}
                onClick={() => updateOutfit({ mouth: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
            <Chip
              selected={outfit.blush}
              onClick={() => updateOutfit({ blush: !outfit.blush })}
            >
              ほお紅
            </Chip>
          </Field>

          <Field label="メガネ">
            {glassesOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.glasses === opt.id}
                onClick={() => updateOutfit({ glasses: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
          </Field>

          <Field label="帽子">
            {hatOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.hat === opt.id}
                onClick={() => updateOutfit({ hat: opt.id })}
              >
                {opt.label}
              </Chip>
            ))}
          </Field>

          <Field label="服">
            {shirtOptions.map((opt) => (
              <Chip
                key={opt.id}
                selected={outfit.shirt === opt.id}
                onClick={() => updateOutfit({ shirt: opt.id })}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full border border-border"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </span>
              </Chip>
            ))}
          </Field>
        </div>
      ) : null}
    </div>
  );
}
