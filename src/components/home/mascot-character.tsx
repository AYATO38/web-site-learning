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
  hasStoredOutfit,
  hatOptions,
  loadOutfit,
  mouthOptions,
  normalizeOutfit,
  personalityPresets,
  randomOutfit,
  saveOutfit,
  shirtOptions,
  skinOptions,
  type MascotOutfit,
} from "@/lib/mascot";
import { MascotSvg } from "@/components/home/mascot-svg";
import {
  AUTH_EVENT,
  fetchMe,
  saveAccountOutfit,
} from "@/lib/auth/client";
import { ChevronLeft, ChevronRight, Dices, Shirt, Sparkles } from "lucide-react";

function wrapYaw(value: number) {
  return ((value % 360) + 360) % 360;
}

function facingBack(yaw: number) {
  const turn = wrapYaw(yaw);
  return turn > 90 && turn < 270;
}

function snappedFace(yaw: number) {
  const base = facingBack(yaw)
    ? Math.round((yaw - 180) / 360) * 360 + 180
    : Math.round(yaw / 360) * 360;
  return base;
}

function snapYaw(yaw: number, velocity: number) {
  const turn = wrapYaw(yaw);
  const flicked = Math.abs(velocity) > 0.45;
  let wantBack = turn > 90 && turn < 270;

  if (flicked) {
    wantBack = velocity > 0 ? turn < 180 : turn > 180;
  }

  if (wantBack) {
    return Math.round((yaw - 180) / 360) * 360 + 180;
  }
  return Math.round(yaw / 360) * 360;
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
  const [hasTurned, setHasTurned] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const yawRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const drag = useRef<{
    x: number;
    yaw: number;
    pointerId: number;
    moved: boolean;
    lastX: number;
    lastAt: number;
    velocity: number;
  } | null>(null);

  yawRef.current = yaw;

  useEffect(() => {
    let cancelled = false;

    async function syncFromAccount() {
      const user = await fetchMe().catch(() => null);
      if (cancelled) return;
      userIdRef.current = user?.id ?? null;
      setLoggedIn(Boolean(user));

      if (!user) {
        setOutfit(loadOutfit());
        return;
      }

      if (user.outfit) {
        const next = normalizeOutfit(user.outfit);
        setOutfit(next);
        saveOutfit(next, user.id);
        return;
      }

      const seed = hasStoredOutfit(user.id) ? loadOutfit(user.id) : loadOutfit();
      setOutfit(seed);
      saveOutfit(seed, user.id);
      void saveAccountOutfit(seed).catch(() => {
        /* keep local copy */
      });
    }

    void syncFromAccount();
    function onAuthChanged() {
      void syncFromAccount();
    }
    window.addEventListener(AUTH_EVENT, onAuthChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, onAuthChanged);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  function persistOutfit(next: MascotOutfit) {
    saveOutfit(next, userIdRef.current);
    if (!userIdRef.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveAccountOutfit(next).catch(() => {
        /* keep local copy */
      });
    }, 450);
  }

  function updateOutfit(patch: Partial<MascotOutfit>) {
    const next = { ...outfit, ...patch };
    setOutfit(next);
    persistOutfit(next);
  }

  function openMenu() {
    faceFront();
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    faceFront();
  }

  function markTurned() {
    setHasTurned(true);
  }

  function spin(direction: 1 | -1) {
    markTurned();
    setYaw((current) => snappedFace(current) + direction * 180);
  }

  function faceFront() {
    setYaw((current) => Math.round(current / 360) * 360);
  }

  function onLookPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      x: event.clientX,
      yaw: yawRef.current,
      pointerId: event.pointerId,
      moved: false,
      lastX: event.clientX,
      lastAt: performance.now(),
      velocity: 0,
    };
  }

  function onLookPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const now = performance.now();
    const step = event.clientX - state.lastX;
    const dt = Math.max(1, now - state.lastAt);
    state.velocity = step / dt;
    state.lastX = event.clientX;
    state.lastAt = now;

    const dx = event.clientX - state.x;
    if (Math.abs(dx) < 16 && !state.moved) return;

    if (!state.moved) {
      event.currentTarget.setPointerCapture(event.pointerId);
      state.moved = true;
      markTurned();
      setDragging(true);
    }
    setYaw(state.yaw + dx * 0.62);
  }

  function onLookPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const velocity = state.velocity;
    const moved = state.moved;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    if (moved) {
      setYaw((current) => snapYaw(current, velocity));
    }
  }

  const showingBack = facingBack(yaw);
  const offFront = Math.abs(wrapYaw(yaw)) > 8 && Math.abs(wrapYaw(yaw) - 360) > 8;

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <div
        className={cn(
          "flex w-full flex-col items-center gap-2",
          menuOpen &&
            "sticky top-0 z-30 -mx-5 border-b border-border bg-white/95 px-5 py-3 backdrop-blur-md",
        )}
      >
        <div className="flex w-full items-center justify-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => spin(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
            aria-label="左に回す"
          >
            <ChevronLeft className="size-5" strokeWidth={2.4} />
          </button>

          <div className="relative z-10 size-44 sm:size-52">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-b from-accent-soft to-white shadow-sm ring-4 ring-accent/15"
            />
            <div
              className={cn(
                "mascot-stage pointer-events-none absolute inset-0 flex items-center justify-center",
                !dragging && "mascot-bob",
              )}
            >
              <div className="h-40 w-36 sm:h-48 sm:w-44">
                <div
                  className={cn(
                    "mascot-spin h-full w-full",
                    dragging ? "is-live" : "is-snap",
                  )}
                  style={{ transform: `rotateY(${yaw}deg)` }}
                >
                  <div className="mascot-face">
                    <MascotSvg outfit={outfit} view="front" />
                  </div>
                  <div className="mascot-face mascot-face-back">
                    <MascotSvg outfit={outfit} view="back" />
                  </div>
                </div>
              </div>
            </div>
            <div
              aria-label="キャラクターを左右にドラッグして回転"
              onPointerDown={onLookPointerDown}
              onPointerMove={onLookPointerMove}
              onPointerUp={onLookPointerUp}
              onPointerCancel={onLookPointerUp}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  spin(-1);
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  spin(1);
                }
              }}
              tabIndex={0}
              className={cn(
                "absolute inset-0 rounded-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-accent",
                dragging ? "cursor-grabbing" : "cursor-grab",
              )}
            />
          </div>

          <button
            type="button"
            onClick={() => spin(1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
            aria-label="右に回す"
          >
            <ChevronRight className="size-5" strokeWidth={2.4} />
          </button>
        </div>

        {outfit.name.trim() ? (
          <p className="rounded-full bg-muted px-3 py-0.5 text-sm font-bold">
            {outfit.name}
          </p>
        ) : null}

        <p className="min-h-5 text-center text-xs font-semibold text-muted-foreground">
          {showingBack
            ? "背面"
            : hasTurned
              ? "正面"
              : "左右にドラッグして回せます"}
        </p>

        <div className="relative z-20 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (menuOpen) closeMenu();
              else openMenu();
            }}
            className="min-h-11 cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            aria-expanded={menuOpen}
          >
            <Sparkles className="mr-1 inline size-3.5" />
            {menuOpen ? "閉じる" : "着せ替え"}
          </button>
          {offFront ? (
            <button
              type="button"
              onClick={faceFront}
              className="cursor-pointer text-xs font-semibold text-accent"
            >
              正面に戻す
            </button>
          ) : null}
        </div>
      </div>

      {menuOpen ? (
        <div className="glass-card relative z-20 mt-4 w-full max-w-sm space-y-4 rounded-[1.4rem] p-4">
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
          <p className="text-xs leading-relaxed text-muted-foreground">
            {loggedIn
              ? "このキャラクターはアカウントに保存されます"
              : "ログインすると、別の端末でも同じキャラを使えます"}
          </p>

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
