import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  Room,
  TeamMember,
  TeamStatus,
  TeamStatusUpdate,
} from "@/lib/nsd-room";

const DATA_PATH = join(process.cwd(), "data", "nsd-rooms.json");
const MAX_MEMBERS = 8;
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
    return { rooms: pruneRooms(parsed.rooms) };
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

function emptyMember(id: string, name: string): TeamMember {
  const now = Date.now();
  return {
    id,
    name,
    current: 0,
    total: 0,
    combo: 0,
    xp: 0,
    lastResult: null,
    finished: false,
    joinedAt: now,
    updatedAt: now,
  };
}

export function getRoom(id: string): Room | undefined {
  const code = id.toUpperCase();
  return readStore().rooms.find((room) => room.id === code);
}

export async function createRoom(teamNames: string[]): Promise<Room> {
  return withLock(() => {
    const store = readStore();
    const existing = new Set(store.rooms.map((room) => room.id));
    const now = Date.now();
    const room: Room = {
      id: createRoomId(existing),
      teams: teamNames.map(emptyTeam),
      updatedAt: now,
    };
    store.rooms.push(room);
    writeStore(store);
    return room;
  });
}

export async function patchTeam(
  id: string,
  update: TeamStatusUpdate,
): Promise<Room | "team_full" | "name_required" | undefined> {
  return withLock(() => {
    const store = readStore();
    const room = store.rooms.find((item) => item.id === id.toUpperCase());
    if (!room) return undefined;

    const team = room.teams.find((item) => item.name === update.teamName);
    if (!team) return undefined;

    for (const other of room.teams) {
      if (other.name === team.name) continue;
      other.members = other.members.filter(
        (member) => member.id !== update.memberId,
      );
    }

    let member = team.members.find((item) => item.id === update.memberId);
    if (!member) {
      const memberName = update.memberName?.trim();
      if (!memberName) return "name_required";
      if (team.members.length >= MAX_MEMBERS) return "team_full";
      member = emptyMember(update.memberId, memberName);
      team.members.push(member);
    } else if (update.memberName?.trim()) {
      member.name = update.memberName.trim();
    }

    if (update.difficulty && !team.difficulty) {
      team.difficulty = update.difficulty;
    }

    if (update.current !== undefined) member.current = update.current;
    if (update.total !== undefined) member.total = update.total;
    if (update.combo !== undefined) member.combo = update.combo;
    if (update.xp !== undefined) member.xp = update.xp;
    if (update.lastResult !== undefined) member.lastResult = update.lastResult;
    if (update.finished !== undefined) member.finished = update.finished;

    const now = Date.now();
    member.updatedAt = now;
    team.updatedAt = now;
    room.updatedAt = now;
    writeStore(store);
    return room;
  });
}
