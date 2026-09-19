import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  applyRoomUpdate,
  normalizeGalleryCapacity,
  normalizeRoom,
  normalizeRoomCode,
  type CreateRoomOptions,
  type Room,
  type RoomPatchResult,
  type RoomUpdate,
  type TeamStatus,
} from "@/lib/nsd-room";

const DATA_PATH = join(process.cwd(), "data", "nsd-rooms.json");
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

type StoreFile = {
  rooms: Room[];
};

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function emptyStore(): StoreFile {
  return { rooms: [] };
}

function pruneRooms(rooms: Room[]): Room[] {
  const cutoff = Date.now() - ROOM_TTL_MS;
  return rooms.filter((room) => room.updatedAt >= cutoff);
}

function readStore(): StoreFile {
  try {
    const raw = readFileSync(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed || !Array.isArray(parsed.rooms)) return emptyStore();
    return { rooms: pruneRooms(parsed.rooms).map(normalizeRoom) };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreFile): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(
    DATA_PATH,
    JSON.stringify({ rooms: pruneRooms(store.rooms) }, null, 2),
    "utf8",
  );
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createRoomId(existing: Set<string>): string {
  let id = "";
  do {
    id = "";
    for (let i = 0; i < 4; i++) {
      id += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (existing.has(id));
  return id;
}

function emptyTeam(name: string): TeamStatus {
  return {
    name,
    difficulty: null,
    members: [],
    updatedAt: Date.now(),
  };
}

export async function getRoom(id: string): Promise<Room | undefined> {
  const code = normalizeRoomCode(id);
  const room = readStore().rooms.find((item) => item.id === code);
  return room ? normalizeRoom(room) : undefined;
}

export async function createRoom(
  teamNames: string[],
  options: CreateRoomOptions = {},
): Promise<Room> {
  return withLock(() => {
    const store = readStore();
    const existing = new Set(store.rooms.map((room) => room.id));
    const now = Date.now();
    const room = normalizeRoom({
      id: createRoomId(existing),
      teams: teamNames.map(emptyTeam),
      updatedAt: now,
      host: options.host ?? null,
      galleryCapacity: normalizeGalleryCapacity(options.galleryCapacity),
      gallery: [],
      settingsNotice: null,
      settingsUpdatedAt: null,
      releasedQuestion: -1,
      resultsReleased: false,
    });
    store.rooms.push(room);
    writeStore(store);
    return room;
  });
}

export async function patchTeam(
  id: string,
  update: RoomUpdate,
): Promise<RoomPatchResult | undefined> {
  return withLock(() => {
    const store = readStore();
    const room = store.rooms.find((item) => item.id === normalizeRoomCode(id));
    if (!room) return undefined;
    if (
      !update.settings &&
      !update.joinGallery &&
      !room.teams.some((team) => team.name === update.teamName)
    ) {
      return undefined;
    }

    const next = applyRoomUpdate(room, update);
    if (typeof next === "string") return next;

    const index = store.rooms.findIndex((item) => item.id === room.id);
    store.rooms[index] = next;
    writeStore(store);
    return next;
  });
}
