import { normalizeTimeLimit } from "@/lib/next-server-day";
import type {
  Room,
  TeamMember,
  TeamStatus,
  TeamStatusUpdate,
} from "@/lib/nsd-room";
import { asUniqueViolation, ensureDb } from "@/lib/db";

const MAX_MEMBERS = 8;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type RoomRow = {
  id: string;
  teams: TeamStatus[] | string;
  updated_at: string | number;
  time_limit_seconds?: number | null;
};

function parseTeams(value: TeamStatus[] | string): TeamStatus[] {
  if (Array.isArray(value)) return value;
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as TeamStatus[];
}

function rowToRoom(row: RoomRow): Room {
  return {
    id: row.id,
    teams: parseTeams(row.teams),
    updatedAt: Number(row.updated_at),
    timeLimitSeconds: normalizeTimeLimit(row.time_limit_seconds),
  };
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

function createRoomId(): string {
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return id;
}

function applyTeamPatch(
  room: Room,
  update: TeamStatusUpdate,
): Room | "team_full" | "name_required" {
  const next: Room = JSON.parse(JSON.stringify(room)) as Room;
  const team = next.teams.find((item) => item.name === update.teamName);
  if (!team) return room;

  for (const other of next.teams) {
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
  next.updatedAt = now;
  return next;
}

async function pruneExpiredRooms(): Promise<void> {
  const sql = await ensureDb();
  const cutoff = Date.now() - ROOM_TTL_MS;
  await sql`DELETE FROM rooms WHERE updated_at < ${cutoff}`;
}

export async function getRoom(id: string): Promise<Room | undefined> {
  await pruneExpiredRooms();
  const sql = await ensureDb();
  const code = id.toUpperCase();
  const rows = (await sql`
    SELECT id, teams, updated_at, time_limit_seconds FROM rooms WHERE id = ${code} LIMIT 1
  `) as RoomRow[];
  return rows[0] ? rowToRoom(rows[0]) : undefined;
}

export async function createRoom(
  teamNames: string[],
  timeLimitSeconds: number | null = null,
): Promise<Room> {
  await pruneExpiredRooms();
  const sql = await ensureDb();
  const now = Date.now();
  const teams = teamNames.map(emptyTeam);
  const limit = normalizeTimeLimit(timeLimitSeconds);

  for (let attempt = 0; attempt < 12; attempt++) {
    const room: Room = {
      id: createRoomId(),
      teams,
      updatedAt: now,
      timeLimitSeconds: limit,
    };
    try {
      await sql`
        INSERT INTO rooms (id, teams, updated_at, time_limit_seconds)
        VALUES (
          ${room.id},
          ${JSON.stringify(room.teams)}::jsonb,
          ${room.updatedAt},
          ${room.timeLimitSeconds}
        )
      `;
      return room;
    } catch (error) {
      if (asUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error("部屋コードを発行できませんでした");
}

export async function patchTeam(
  id: string,
  update: TeamStatusUpdate,
): Promise<Room | "team_full" | "name_required" | undefined> {
  const sql = await ensureDb();
  const code = id.toUpperCase();

  for (let attempt = 0; attempt < 8; attempt++) {
    const room = await getRoom(code);
    if (!room) return undefined;

    const team = room.teams.find((item) => item.name === update.teamName);
    if (!team) return undefined;

    const next = applyTeamPatch(room, update);
    if (next === "team_full" || next === "name_required") return next;

    const rows = (await sql`
      UPDATE rooms
      SET
        teams = ${JSON.stringify(next.teams)}::jsonb,
        updated_at = ${next.updatedAt}
      WHERE id = ${room.id} AND updated_at = ${room.updatedAt}
      RETURNING id, teams, updated_at, time_limit_seconds
    `) as RoomRow[];

    if (rows[0]) return rowToRoom(rows[0]);
  }

  throw new Error("部屋の更新が混み合っています。もう一度試してください");
}
