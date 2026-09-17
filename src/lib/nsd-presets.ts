const STORAGE_KEY = "nsd-room-presets";
const MAX_PRESETS = 20;

export type RoomPreset = {
  id: string;
  name: string;
  teamNames: string[];
  galleryCapacity: number;
  updatedAt: number;
};

function isRoomPreset(value: unknown): value is RoomPreset {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.teamNames) &&
    v.teamNames.every((item) => typeof item === "string") &&
    typeof v.galleryCapacity === "number" &&
    typeof v.updatedAt === "number"
  );
}

function readAll(): RoomPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRoomPreset) : [];
  } catch {
    return [];
  }
}

function writeAll(presets: RoomPreset[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** Saved presets, most recently saved first. Browser-local — nothing here reaches the server. */
export function loadPresets(): RoomPreset[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Saving under a name that already exists updates that preset instead of duplicating it. */
export function savePreset(input: {
  name: string;
  teamNames: string[];
  galleryCapacity: number;
}): RoomPreset[] {
  const name = input.name.trim();
  const all = readAll();
  const existing = all.find((preset) => preset.name === name);
  const preset: RoomPreset = {
    id: existing?.id ?? crypto.randomUUID(),
    name,
    teamNames: input.teamNames,
    galleryCapacity: input.galleryCapacity,
    updatedAt: Date.now(),
  };
  const next = [...all.filter((item) => item.id !== preset.id), preset].slice(
    -MAX_PRESETS,
  );
  writeAll(next);
  return loadPresets();
}

export function deletePreset(id: string): RoomPreset[] {
  const next = readAll().filter((preset) => preset.id !== id);
  writeAll(next);
  return loadPresets();
}
