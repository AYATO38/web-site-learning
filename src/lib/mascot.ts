export const skinOptions = [
  { id: "peach", label: "ピーチ", color: "#f0b89a" },
  { id: "fair", label: "ライト", color: "#f7d7c4" },
  { id: "warm", label: "ウォーム", color: "#d08b5b" },
  { id: "tan", label: "タン", color: "#b56a3c" },
  { id: "deep", label: "ディープ", color: "#6d3e28" },
] as const;

export const hairStyles = [
  { id: "short", label: "ショート" },
  { id: "messy", label: "ラフ" },
  { id: "side", label: "流し前髪" },
  { id: "curly", label: "カール" },
  { id: "ponytail", label: "ポニー" },
  { id: "bun", label: "おだんご" },
  { id: "bald", label: "なし" },
] as const;

export const hairColors = [
  { id: "black", label: "ブラック", color: "#1c1917" },
  { id: "brown", label: "ブラウン", color: "#5c3d2e" },
  { id: "blonde", label: "ブロンド", color: "#e6c15a" },
  { id: "orange", label: "オレンジ", color: "#e85d04" },
  { id: "navy", label: "ネイビー", color: "#1e3a5f" },
  { id: "pink", label: "ピンク", color: "#e879a9" },
] as const;

export const browOptions = [
  { id: "natural", label: "ナチュラル" },
  { id: "thick", label: "太め" },
  { id: "thin", label: "細め" },
  { id: "raised", label: "キリッ" },
] as const;

export const eyeOptions = [
  { id: "round", label: "まる" },
  { id: "almond", label: "アーモンド" },
  { id: "sleepy", label: "眠そう" },
  { id: "sparkle", label: "キラキラ" },
] as const;

export const mouthOptions = [
  { id: "smile", label: "ほほえみ" },
  { id: "grin", label: "にこっ" },
  { id: "cat", label: "ω口" },
  { id: "serious", label: "まじめ" },
  { id: "wow", label: "おどろき" },
] as const;

export const glassesOptions = [
  { id: "none", label: "なし" },
  { id: "round", label: "まるメガネ" },
  { id: "square", label: "スクエア" },
  { id: "sun", label: "サングラス" },
] as const;

export const hatOptions = [
  { id: "none", label: "なし" },
  { id: "cap", label: "キャップ" },
  { id: "beanie", label: "ニット帽" },
  { id: "headphones", label: "ヘッドホン" },
  { id: "ribbon", label: "リボン" },
] as const;

export const shirtOptions = [
  { id: "white-tee", label: "白T", color: "#ffffff", kind: "tee" },
  { id: "blue-tee", label: "青T", color: "#3b9eff", kind: "tee" },
  { id: "black-tee", label: "黒T", color: "#18181b", kind: "tee" },
  { id: "stripe", label: "ボーダー", color: "#ffffff", kind: "stripe" },
  { id: "hoodie-blue", label: "青パーカー", color: "#2563eb", kind: "hoodie" },
  { id: "hoodie-pink", label: "ピンクパーカー", color: "#fb7185", kind: "hoodie" },
  { id: "hoodie-navy", label: "紺パーカー", color: "#1e3a5f", kind: "hoodie" },
  { id: "polo", label: "ポロ", color: "#166534", kind: "polo" },
] as const;

export type SkinOption = (typeof skinOptions)[number]["id"];
export type HairStyle = (typeof hairStyles)[number]["id"];
export type HairColor = (typeof hairColors)[number]["id"];
export type BrowOption = (typeof browOptions)[number]["id"];
export type EyeOption = (typeof eyeOptions)[number]["id"];
export type MouthOption = (typeof mouthOptions)[number]["id"];
export type GlassesOption = (typeof glassesOptions)[number]["id"];
export type HatOption = (typeof hatOptions)[number]["id"];
export type ShirtOption = (typeof shirtOptions)[number]["id"];

export type MascotOutfit = {
  name: string;
  skin: SkinOption;
  hair: HairStyle;
  hairColor: HairColor;
  brows: BrowOption;
  eyes: EyeOption;
  mouth: MouthOption;
  glasses: GlassesOption;
  hat: HatOption;
  shirt: ShirtOption;
  blush: boolean;
};

export const defaultOutfit: MascotOutfit = {
  name: "",
  skin: "peach",
  hair: "short",
  hairColor: "black",
  brows: "natural",
  eyes: "round",
  mouth: "smile",
  glasses: "none",
  hat: "cap",
  shirt: "white-tee",
  blush: true,
};

export const personalityPresets: {
  id: string;
  label: string;
  desc: string;
  outfit: MascotOutfit;
}[] = [
  {
    id: "genki",
    label: "元気",
    desc: "ラフ髪でにこにこ",
    outfit: {
      name: "",
      skin: "peach",
      hair: "messy",
      hairColor: "orange",
      brows: "raised",
      eyes: "sparkle",
      mouth: "grin",
      glasses: "none",
      hat: "none",
      shirt: "hoodie-blue",
      blush: true,
    },
  },
  {
    id: "cool",
    label: "クール",
    desc: "サングラスでかっこよく",
    outfit: {
      name: "",
      skin: "tan",
      hair: "side",
      hairColor: "black",
      brows: "thick",
      eyes: "almond",
      mouth: "serious",
      glasses: "sun",
      hat: "none",
      shirt: "black-tee",
      blush: false,
    },
  },
  {
    id: "study",
    label: "まじめ",
    desc: "メガネで集中モード",
    outfit: {
      name: "",
      skin: "fair",
      hair: "short",
      hairColor: "brown",
      brows: "natural",
      eyes: "round",
      mouth: "smile",
      glasses: "square",
      hat: "none",
      shirt: "polo",
      blush: false,
    },
  },
  {
    id: "creative",
    label: "クリエイター",
    desc: "ヘッドホンで作業中",
    outfit: {
      name: "",
      skin: "warm",
      hair: "curly",
      hairColor: "navy",
      brows: "thin",
      eyes: "sleepy",
      mouth: "cat",
      glasses: "none",
      hat: "headphones",
      shirt: "hoodie-navy",
      blush: true,
    },
  },
  {
    id: "pop",
    label: "ポップ",
    desc: "リボンとピンク",
    outfit: {
      name: "",
      skin: "peach",
      hair: "ponytail",
      hairColor: "pink",
      brows: "thin",
      eyes: "sparkle",
      mouth: "wow",
      glasses: "round",
      hat: "ribbon",
      shirt: "hoodie-pink",
      blush: true,
    },
  },
];

const STORAGE_KEY = "posse-mascot-outfit";

function ids<T extends { id: string }>(list: readonly T[]): T["id"][] {
  return list.map((item) => item.id);
}

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeOutfit(raw: unknown): MascotOutfit {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const name = typeof data.name === "string" ? data.name.slice(0, 8) : "";
  return {
    name,
    skin: pick(data.skin, ids(skinOptions), defaultOutfit.skin),
    hair: pick(data.hair, ids(hairStyles), defaultOutfit.hair),
    hairColor: pick(data.hairColor, ids(hairColors), defaultOutfit.hairColor),
    brows: pick(data.brows, ids(browOptions), defaultOutfit.brows),
    eyes: pick(data.eyes, ids(eyeOptions), defaultOutfit.eyes),
    mouth: pick(data.mouth, ids(mouthOptions), defaultOutfit.mouth),
    glasses: pick(data.glasses, ids(glassesOptions), defaultOutfit.glasses),
    hat: pick(data.hat, ids(hatOptions), defaultOutfit.hat),
    shirt: pick(data.shirt, ids(shirtOptions), defaultOutfit.shirt),
    blush: typeof data.blush === "boolean" ? data.blush : defaultOutfit.blush,
  };
}

export function loadOutfit(): MascotOutfit {
  if (typeof window === "undefined") return defaultOutfit;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeOutfit(JSON.parse(raw)) : defaultOutfit;
  } catch {
    return defaultOutfit;
  }
}

export function saveOutfit(outfit: MascotOutfit): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit));
}

function sample<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

export function randomOutfit(keepName = ""): MascotOutfit {
  return {
    name: keepName.slice(0, 8),
    skin: sample(skinOptions).id,
    hair: sample(hairStyles).id,
    hairColor: sample(hairColors).id,
    brows: sample(browOptions).id,
    eyes: sample(eyeOptions).id,
    mouth: sample(mouthOptions).id,
    glasses: sample(glassesOptions).id,
    hat: sample(hatOptions).id,
    shirt: sample(shirtOptions).id,
    blush: Math.random() > 0.4,
  };
}
