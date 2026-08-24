import { normalizeTimeLimit } from "@/lib/next-server-day";
import {
  applyRoomUpdate,
  normalizeGalleryCapacity,
  normalizeRoom,
  type CreateRoomOptions,
  type GalleryMember,
  type Room,
  type RoomPatchResult,
  type RoomUpdate,
  type TeamStatus,
} from "@/lib/nsd-room";
import { asUniqueViolation, ensureDb } from "@/lib/db";

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type RoomRow = {
  id: string;
  teams: TeamStatus[] | string;
  updated_at: string | number;
  time_limit_seconds?: number | null;
  host_member_id?: string | null;
  host_name?: string | null;
  gallery_capacity?: number | null;
  gallery?: GalleryMember[] | string | null;
  settings_notice?: string | null;
  settings_updated_at?: string | number | null;
};

function parseJsonArray<T>(value: T[] | string | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function rowToRoom(row: RoomRow): Room {
  return normalizeRoom({
    id: row.id,
    teams: parseJsonArray<TeamStatus>(row.teams),
    updatedAt: Number(row.updated_at),
    timeLimitSeconds: normalizeTimeLimit(row.time_limit_seconds),
    host: row.host_member_id
      ? {
          memberId: row.host_member_id,
          name: row.host_name?.trim() || "ルームマスター",
        }
      : null,
    galleryCapacity: row.gallery_capacity ?? 0,
    gallery: parseJsonArray<GalleryMember>(row.gallery),
    settingsNotice: row.settings_notice ?? null,
    settingsUpdatedAt: row.settings_updated_at
      ? Number(row.settings_updated_at)
      : null,
  });
}

function emptyTeam(name: string): TeamStatus {
  return {
    name,
    difficulty: null,
    members: [],
    updatedAt: Date.now(),
  };
}

function createRoomId(): string {
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return id;
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
    SELECT id, teams, updated_at, time_limit_seconds,
           host_member_id, host_name, gallery_capacity, gallery,
           settings_notice, settings_updated_at
    FROM rooms WHERE id = ${code} LIMIT 1
  `) as RoomRow[];
  return rows[0] ? rowToRoom(rows[0]) : undefined;
}

export async function createRoom(
  teamNames: string[],
  timeLimitSeconds: number | null = null,
  options: CreateRoomOptions = {},
): Promise<Room> {
  await pruneExpiredRooms();
  const sql = await ensureDb();
  const now = Date.now();
  const teams = teamNames.map(emptyTeam);
  const limit = normalizeTimeLimit(timeLimitSeconds);
  const galleryCapacity = normalizeGalleryCapacity(options.galleryCapacity);
  const host = options.host ?? null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const room = normalizeRoom({
      id: createRoomId(),
      teams,
      updatedAt: now,
      timeLimitSeconds: limit,
      host,
      galleryCapacity,
      gallery: [],
      settingsNotice: null,
      settingsUpdatedAt: null,
    });
    try {
      await sql`
        INSERT INTO rooms (
          id, teams, updated_at, time_limit_seconds,
          host_member_id, host_name, gallery_capacity, gallery,
          settings_notice, settings_updated_at
        )
        VALUES (
          ${room.id},
          ${JSON.stringify(room.teams)}::jsonb,
          ${room.updatedAt},
          ${room.timeLimitSeconds},
          ${room.host?.memberId ?? null},
          ${room.host?.name ?? null},
          ${room.galleryCapacity},
          ${JSON.stringify(room.gallery)}::jsonb,
          ${room.settingsNotice},
          ${room.settingsUpdatedAt}
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
  update: RoomUpdate,
): Promise<RoomPatchResult | undefined> {
  const sql = await ensureDb();
  const code = id.toUpperCase();

  for (let attempt = 0; attempt < 8; attempt++) {
    const room = await getRoom(code);
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

    const rows = (await sql`
      UPDATE rooms
      SET
        teams = ${JSON.stringify(next.teams)}::jsonb,
        updated_at = ${next.updatedAt},
        time_limit_seconds = ${next.timeLimitSeconds},
        host_member_id = ${next.host?.memberId ?? null},
        host_name = ${next.host?.name ?? null},
        gallery_capacity = ${next.galleryCapacity},
        gallery = ${JSON.stringify(next.gallery)}::jsonb,
        settings_notice = ${next.settingsNotice},
        settings_updated_at = ${next.settingsUpdatedAt}
      WHERE id = ${room.id} AND updated_at = ${room.updatedAt}
      RETURNING id, teams, updated_at, time_limit_seconds,
                host_member_id, host_name, gallery_capacity, gallery,
                settings_notice, settings_updated_at
    `) as RoomRow[];

    if (rows[0]) return rowToRoom(rows[0]);
  }

  throw new Error("部屋の更新が混み合っています。もう一度試してください");
}
