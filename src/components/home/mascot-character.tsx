"use client";

import { useEffect, useState } from "react";
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
import { Dices, Shirt, Sparkles } from "lucide-react";

function colorOf<T extends { id: string; color: string }>(
  list: readonly T[],
  id: string,
  fallback: string,
) {
  return list.find((item) => item.id === id)?.color ?? fallback;
}

function HairBack({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "bald") return null;
  if (style === "ponytail") {
    return (
      <>
        <ellipse cx="100" cy="62" rx="40" ry="28" fill={color} />
        <path d="M128 78 Q168 96 154 148 Q140 128 124 96" fill={color} />
      </>
    );
  }
  if (style === "bun") {
    return (
      <>
        <ellipse cx="100" cy="64" rx="38" ry="26" fill={color} />
        <circle cx="100" cy="34" r="16" fill={color} />
        <circle cx="100" cy="34" r="7" fill="#fff" opacity="0.12" />
      </>
    );
  }
  if (style === "curly") {
    return (
      <>
        <circle cx="68" cy="58" r="16" fill={color} />
        <circle cx="88" cy="42" r="18" fill={color} />
        <circle cx="112" cy="40" r="18" fill={color} />
        <circle cx="132" cy="58" r="16" fill={color} />
        <circle cx="74" cy="80" r="14" fill={color} />
        <circle cx="126" cy="80" r="14" fill={color} />
      </>
    );
  }
  if (style === "messy") {
    return (
      <path
        d="M56 86 L62 44 L78 58 L90 32 L104 50 L118 28 L132 54 L148 40 L146 86 Q100 48 56 86 Z"
        fill={color}
      />
    );
  }
  return <ellipse cx="100" cy="62" rx="42" ry="30" fill={color} />;
}

function HairFront({
  style,
  color,
}: {
  style: MascotOutfit["hair"];
  color: string;
}) {
  if (style === "bald" || style === "bun") return null;
  if (style === "side") {
    return (
      <path d="M58 78 Q86 48 128 70 Q108 62 78 86 Q64 90 58 78 Z" fill={color} />
    );
  }
  if (style === "messy") {
    return (
      <path d="M62 80 Q84 58 110 72 Q96 64 72 88 Z" fill={color} />
    );
  }
  if (style === "curly") {
    return (
      <>
        <circle cx="82" cy="70" r="10" fill={color} />
        <circle cx="100" cy="64" r="9" fill={color} />
        <circle cx="118" cy="70" r="10" fill={color} />
      </>
    );
  }
  return (
    <path d="M60 78 Q100 52 140 78 Q120 68 100 74 Q80 68 60 78 Z" fill={color} />
  );
}

function Eyes({
  kind,
  glasses,
}: {
  kind: MascotOutfit["eyes"];
  glasses: MascotOutfit["glasses"];
}) {
  const hidden = glasses === "sun";
  if (kind === "sleepy") {
    return (
      <>
        <path d="M76 88 Q84 84 92 88" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
        <path d="M108 88 Q116 84 124 88" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }
  const rx = kind === "almond" ? 7 : 8;
  const ry = kind === "almond" ? 6 : 8;
  return (
    <>
      <ellipse cx="84" cy="88" rx={rx} ry={ry} fill="#fff" />
      <ellipse cx="116" cy="88" rx={rx} ry={ry} fill="#fff" />
      {!hidden && (
        <>
          <ellipse cx="85" cy="89" rx="3.4" ry="4.2" fill="#1c1917" />
          <ellipse cx="117" cy="89" rx="3.4" ry="4.2" fill="#1c1917" />
          <circle cx="86.4" cy="87.2" r="1.2" fill="#fff" />
          <circle cx="118.4" cy="87.2" r="1.2" fill="#fff" />
          {kind === "sparkle" && (
            <>
              <path d="M74 78 L75.5 81.5 L79 83 L75.5 84.5 L74 88 L72.5 84.5 L69 83 L72.5 81.5 Z" fill="#f5c542" />
              <path d="M126 76 L127.3 79 L131 80.2 L127.3 81.4 L126 84.5 L124.7 81.4 L121 80.2 L124.7 79 Z" fill="#f5c542" />
            </>
          )}
        </>
      )}
    </>
  );
}

function Brows({ kind }: { kind: MascotOutfit["brows"] }) {
  const w = kind === "thick" ? 4.2 : kind === "thin" ? 2 : 3;
  if (kind === "raised") {
    return (
      <>
        <path d="M74 76 Q84 70 94 76" fill="none" stroke="#1c1917" strokeWidth={w} strokeLinecap="round" />
        <path d="M106 78 Q116 74 126 76" fill="none" stroke="#1c1917" strokeWidth={w} strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <path d="M74 78 Q84 74 94 78" fill="none" stroke="#1c1917" strokeWidth={w} strokeLinecap="round" />
      <path d="M106 78 Q116 74 126 78" fill="none" stroke="#1c1917" strokeWidth={w} strokeLinecap="round" />
    </>
  );
}

function Mouth({ kind }: { kind: MascotOutfit["mouth"] }) {
  if (kind === "grin") {
    return (
      <>
        <path d="M86 110 Q100 124 114 110" fill="#fff" stroke="#1c1917" strokeWidth="2.4" />
        <path d="M90 112 Q100 120 110 112" fill="none" stroke="#f43f5e" strokeWidth="2" />
      </>
    );
  }
  if (kind === "cat") {
    return (
      <path d="M92 112 Q96 108 100 112 Q104 108 108 112" fill="none" stroke="#1c1917" strokeWidth="2.6" strokeLinecap="round" />
    );
  }
  if (kind === "serious") {
    return <path d="M90 112 H110" fill="none" stroke="#1c1917" strokeWidth="2.6" strokeLinecap="round" />;
  }
  if (kind === "wow") {
    return <ellipse cx="100" cy="114" rx="6" ry="8" fill="#fff" stroke="#1c1917" strokeWidth="2.2" />;
  }
  return (
    <path d="M88 110 Q100 120 112 110" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
  );
}

function Glasses({ kind }: { kind: MascotOutfit["glasses"] }) {
  if (kind === "none") return null;
  const fill = kind === "sun" ? "#18181b" : "none";
  const opacity = kind === "sun" ? 0.72 : 1;
  const r = kind === "round" ? 12 : 0;
  return (
    <g opacity={opacity} stroke="#1c1917" strokeWidth="2.4" fill={fill}>
      {kind === "square" ? (
        <>
          <rect x="70" y="80" width="24" height="18" rx="4" />
          <rect x="106" y="80" width="24" height="18" rx="4" />
        </>
      ) : (
        <>
          <circle cx="84" cy="89" r={kind === "sun" ? 13 : r} />
          <circle cx="116" cy="89" r={kind === "sun" ? 13 : r} />
        </>
      )}
      <path d="M94 88 H106" />
      <path d="M70 86 Q58 84 54 90" fill="none" />
      <path d="M130 86 Q142 84 146 90" fill="none" />
    </g>
  );
}

function Hat({ kind, hairColor }: { kind: MascotOutfit["hat"]; hairColor: string }) {
  if (kind === "none") return null;
  if (kind === "cap") {
    return (
      <g>
        <path d="M58 70 Q100 28 144 70 L146 80 Q100 58 54 80 Z" fill="#3b9eff" />
        <ellipse cx="100" cy="78" rx="50" ry="8" fill="#2563eb" />
        <rect x="128" y="74" width="30" height="7" rx="3" fill="#3b9eff" />
      </g>
    );
  }
  if (kind === "beanie") {
    return (
      <g>
        <path d="M58 78 Q100 24 142 78 Q100 62 58 78 Z" fill="#be123c" />
        <ellipse cx="100" cy="78" rx="44" ry="8" fill="#9f1239" />
        <circle cx="100" cy="30" r="8" fill="#fda4af" />
      </g>
    );
  }
  if (kind === "headphones") {
    return (
      <g>
        <path d="M62 78 Q100 36 138 78" fill="none" stroke="#18181b" strokeWidth="7" />
        <rect x="48" y="78" width="16" height="28" rx="8" fill="#18181b" />
        <rect x="136" y="78" width="16" height="28" rx="8" fill="#18181b" />
        <rect x="51" y="84" width="10" height="16" rx="4" fill="#3b9eff" />
        <rect x="139" y="84" width="10" height="16" rx="4" fill="#3b9eff" />
      </g>
    );
  }
  return (
    <g>
      <path d="M118 38 Q132 22 148 40 Q136 36 128 48 Z" fill="#fb7185" />
      <path d="M132 22 Q140 8 154 24 Q144 18 138 32 Z" fill="#fb7185" />
      <circle cx="132" cy="28" r="5" fill={hairColor} />
    </g>
  );
}

function ShirtBody({ shirt, skin }: { shirt: MascotOutfit["shirt"]; skin: string }) {
  const option = shirtOptions.find((item) => item.id === shirt) ?? shirtOptions[0];
  const color = option.color;
  const dark = option.kind === "hoodie" || option.id === "black-tee" || option.kind === "polo";
  const stitch = dark ? "rgba(255,255,255,0.18)" : "#e4e4e7";

  return (
    <>
      {option.kind === "hoodie" && (
        <path d="M70 128 Q100 108 130 128 L138 148 Q100 138 62 148 Z" fill={color} />
      )}
      <path
        d="M64 142 Q100 130 136 142 L142 204 Q100 214 58 204 Z"
        fill={color}
        stroke={stitch}
        strokeWidth="2"
      />
      {option.kind === "stripe" && (
        <>
          <path d="M66 158 H134" stroke="#3b9eff" strokeWidth="7" />
          <path d="M62 176 H138" stroke="#3b9eff" strokeWidth="7" />
          <path d="M60 194 H140" stroke="#3b9eff" strokeWidth="7" />
        </>
      )}
      {option.kind === "polo" && (
        <path d="M92 142 L100 158 L108 142" fill="none" stroke="#14532d" strokeWidth="3" />
      )}
      {option.kind === "hoodie" && (
        <path d="M86 168 Q100 176 114 168 Q100 186 86 168 Z" fill="none" stroke={stitch} strokeWidth="2" />
      )}
      {option.id === "white-tee" && (
        <circle cx="100" cy="168" r="5" fill="#3b9eff" />
      )}
      <ellipse cx="56" cy="164" rx="13" ry="22" fill={skin} />
      <ellipse cx="144" cy="164" rx="13" ry="22" fill={skin} />
      <path d="M64 148 Q52 150 48 168" fill={color} />
      <path d="M136 148 Q148 150 152 168" fill={color} />
    </>
  );
}

function MascotSvg({ outfit }: { outfit: MascotOutfit }) {
  const skin = colorOf(skinOptions, outfit.skin, "#f0b89a");
  const hair = colorOf(hairColors, outfit.hairColor, "#1c1917");

  return (
    <svg viewBox="0 0 200 250" className="h-full w-full drop-shadow-sm" aria-hidden>
      <ellipse cx="100" cy="236" rx="48" ry="8" fill="#e4e4e7" />
      <rect x="78" y="200" width="16" height="28" rx="8" fill={skin} />
      <rect x="106" y="200" width="16" height="28" rx="8" fill={skin} />
      <rect x="74" y="222" width="22" height="10" rx="5" fill="#18181b" />
      <rect x="104" y="222" width="22" height="10" rx="5" fill="#18181b" />
      <ShirtBody shirt={outfit.shirt} skin={skin} />
      <rect x="90" y="126" width="20" height="18" rx="8" fill={skin} />
      <HairBack style={outfit.hair} color={hair} />
      <ellipse cx="58" cy="94" rx="8" ry="12" fill={skin} />
      <ellipse cx="142" cy="94" rx="8" ry="12" fill={skin} />
      <ellipse cx="100" cy="90" rx="42" ry="48" fill={skin} />
      {outfit.blush && (
        <>
          <ellipse cx="74" cy="102" rx="8" ry="5" fill="#fb7185" opacity="0.35" />
          <ellipse cx="126" cy="102" rx="8" ry="5" fill="#fb7185" opacity="0.35" />
        </>
      )}
      <Brows kind={outfit.brows} />
      <Eyes kind={outfit.eyes} glasses={outfit.glasses} />
      <path d="M100 96 L100 104" stroke="#c0846a" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="100" cy="104" rx="3.2" ry="2.2" fill="#c0846a" opacity="0.45" />
      <Mouth kind={outfit.mouth} />
      <HairFront style={outfit.hair} color={hair} />
      <Glasses kind={outfit.glasses} />
      <Hat kind={outfit.hat} hairColor={hair} />
    </svg>
  );
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
        "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        selected
          ? "border-accent bg-accent text-white"
          : "border-border bg-muted text-foreground hover:border-accent/40",
      )}
    >
      {children}
    </button>
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
    <div className="relative flex w-full min-w-0 flex-col items-center">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={cn(
          "group flex flex-col items-center gap-3",
          menuOpen && "opacity-95",
        )}
        aria-label="キャラクターをカスタマイズ"
        aria-expanded={menuOpen}
      >
        <span
          className={cn(
            "relative flex size-44 items-center justify-center rounded-full bg-white ring-4 ring-accent/15 transition-all duration-300 group-hover:ring-accent/30 group-active:scale-95 sm:size-52",
            menuOpen && "ring-accent/30",
          )}
        >
          <span className="size-36 sm:size-44">
            <MascotSvg outfit={outfit} />
          </span>
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="mr-1 inline size-3" />
          タップして着せ替え
        </span>
      </button>
      {outfit.name.trim() && (
        <p className="mt-4 rounded-full bg-muted px-3 py-1 text-sm font-bold text-foreground">
          {outfit.name}
        </p>
      )}

      {menuOpen && (
        <div className="glass-card mt-5 w-full max-w-sm rounded-[1.4rem] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Shirt className="size-4 text-accent" />
              着せ替えメニュー
            </p>
            <button
              type="button"
              onClick={() => updateOutfit(randomOutfit(outfit.name))}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-bold text-foreground"
            >
              <Dices className="size-3.5" />
              おまかせ
            </button>
          </div>

          <label className="mb-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

          <fieldset className="mb-4">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              個性プリセット
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {personalityPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => updateOutfit({ ...preset.outfit, name: outfit.name })}
                  className="rounded-xl border border-border bg-muted px-3 py-2 text-left hover:border-accent/40"
                >
                  <p className="text-sm font-bold">{preset.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{preset.desc}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                肌
              </legend>
              <div className="flex flex-wrap gap-2">
                {skinOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={opt.label}
                    onClick={() => updateOutfit({ skin: opt.id })}
                    className={cn(
                      "size-7 rounded-full border-2",
                      outfit.skin === opt.id ? "border-accent" : "border-border",
                    )}
                    style={{ backgroundColor: opt.color }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                髪型
              </legend>
              <div className="flex flex-wrap gap-2">
                {hairStyles.map((opt) => (
                  <Chip
                    key={opt.id}
                    selected={outfit.hair === opt.id}
                    onClick={() => updateOutfit({ hair: opt.id })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                髪色
              </legend>
              <div className="flex flex-wrap gap-2">
                {hairColors.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-label={opt.label}
                    onClick={() => updateOutfit({ hairColor: opt.id })}
                    className={cn(
                      "size-7 rounded-full border-2",
                      outfit.hairColor === opt.id ? "border-accent" : "border-border",
                    )}
                    style={{ backgroundColor: opt.color }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                眉 / 目 / 口
              </legend>
              <div className="flex flex-wrap gap-2">
                {browOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    selected={outfit.brows === opt.id}
                    onClick={() => updateOutfit({ brows: opt.id })}
                  >
                    眉:{opt.label}
                  </Chip>
                ))}
                {eyeOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    selected={outfit.eyes === opt.id}
                    onClick={() => updateOutfit({ eyes: opt.id })}
                  >
                    目:{opt.label}
                  </Chip>
                ))}
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
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                メガネ / 帽子
              </legend>
              <div className="flex flex-wrap gap-2">
                {glassesOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    selected={outfit.glasses === opt.id}
                    onClick={() => updateOutfit({ glasses: opt.id })}
                  >
                    {opt.label}
                  </Chip>
                ))}
                {hatOptions.map((opt) => (
                  <Chip
                    key={opt.id}
                    selected={outfit.hat === opt.id}
                    onClick={() => updateOutfit({ hat: opt.id })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                服
              </legend>
              <div className="flex flex-wrap gap-2">
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
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}
