export type CapOption = "none" | "blue" | "black";
export type ShirtOption = "white" | "blue" | "gray";

export type MascotOutfit = {
  cap: CapOption;
  shirt: ShirtOption;
};

export const capOptions: { id: CapOption; label: string }[] = [
  { id: "none", label: "なし" },
  { id: "blue", label: "ブルーキャップ" },
  { id: "black", label: "ブラックキャップ" },
];

export const shirtOptions: { id: ShirtOption; label: string; color: string }[] =
  [
    { id: "white", label: "ホワイトT", color: "#ffffff" },
    { id: "blue", label: "ブルーT", color: "#0066ff" },
    { id: "gray", label: "グレーT", color: "#a1a1aa" },
  ];

export const defaultOutfit: MascotOutfit = {
  cap: "blue",
  shirt: "white",
};

const STORAGE_KEY = "posse-mascot-outfit";

export function loadOutfit(): MascotOutfit {
  if (typeof window === "undefined") return defaultOutfit;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MascotOutfit) : defaultOutfit;
  } catch {
    return defaultOutfit;
  }
}

export function saveOutfit(outfit: MascotOutfit): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(outfit));
}
