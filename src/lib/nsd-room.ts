import { normalizeTimeLimit, type Difficulty } from "@/lib/next-server-day";

export type LastResult = "correct" | "wrong" | null;

export type TeamMember = {
  id: string;
  name: string;
  current: number;
  total: number;
  combo: number;
  xp: number;
  lastResult: LastResult;
  finished: boolean;
  joinedAt: number;
  updatedAt: number;
};

export type TeamStatus = {
  name: string;
  difficulty: Difficulty | null;
  members: TeamMember[];
  updatedAt: number;
};

export type RoomHost = {
  memberId: string;
  name: string;
};

export type GalleryMember = {
  id: string;
  name: string;
  joinedAt: number;
};

export type Room = {
  id: string;
  teams: TeamStatus[];
  updatedAt: number;
  timeLimitSeconds: number | null;
  host: RoomHost | null;
  galleryCapacity: number;
  gallery: GalleryMember[];
  settingsNotice: string | null;
  settingsUpdatedAt: number | null;
};

export const TEAM_MAX_MEMBERS = 8;
export const GALLERY_MAX = 20;
export const DEFAULT_GALLERY_CAPACITY = 8;

export type CreateRoomOptions = {
  galleryCapacity?: number;
  host?: RoomHost | null;
};

export type RoomSettingsPatch = {
  timeLimitSeconds?: number | null;
  galleryCapacity?: number;
};

export type RoomUpdate = TeamStatusUpdate & {
  joinGallery?: boolean;
  settings?: RoomSettingsPatch;
};

export type RoomPatchResult =
  | Room
  | "team_full"
  | "name_required"
  | "gallery_full"
  | "gallery_unavailable"
  | "not_master"
  | "quiz_started"
  | "gallery_occupied";

export function normalizeGalleryCapacity(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_GALLERY_CAPACITY;
  return Math.min(GALLERY_MAX, Math.max(0, parsed));
}

export function normalizeRoom(room: Room): Room {
  return {
    ...room,
    host:
      room.host?.memberId
        ? {
            memberId: room.host.memberId,
            name: room.host.name.trim() || "ルームマスター",
          }
        : null,
    galleryCapacity: normalizeGalleryCapacity(room.galleryCapacity ?? 0),
    gallery: Array.isArray(room.gallery) ? room.gallery : [],
    settingsNotice: room.settingsNotice ?? null,
    settingsUpdatedAt:
      typeof room.settingsUpdatedAt === "number" ? room.settingsUpdatedAt : null,
  };
}

export function isHost(room: Room, memberId: string | null | undefined): boolean {
  return Boolean(memberId && room.host?.memberId === memberId);
}

export function quizStarted(room: Room): boolean {
  return room.teams.some((team) =>
    team.members.some((member) => member.total > 0 || member.finished),
  );
}

export function allTeamsDone(room: Room): boolean {
  return (
    quizStarted(room) &&
    room.teams.every(
      (team) => team.members.length === 0 || teamFinished(team),
    )
  );
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

function syncHostName(room: Room, memberId: string, name: string) {
  if (room.host?.memberId === memberId) {
    room.host = { memberId, name };
  }
}

export function applyRoomUpdate(
  room: Room,
  update: RoomUpdate,
): RoomPatchResult {
  const next = normalizeRoom(JSON.parse(JSON.stringify(room)) as Room);
  const memberName = update.memberName?.trim();

  if (update.settings) {
    if (next.host?.memberId !== update.memberId) return "not_master";
    const notices: string[] = [];
    if (update.settings.timeLimitSeconds !== undefined) {
      if (quizStarted(next)) return "quiz_started";
      next.timeLimitSeconds = normalizeTimeLimit(
        update.settings.timeLimitSeconds,
      );
      notices.push(
        `制限時間を${next.timeLimitSeconds ? `1問 ${next.timeLimitSeconds}秒` : "なし"}に`,
      );
    }
    if (update.settings.galleryCapacity !== undefined) {
      const cap = normalizeGalleryCapacity(update.settings.galleryCapacity);
      if (cap < next.gallery.length) return "gallery_occupied";
      next.galleryCapacity = cap;
      notices.push(`ギャラリー枠を${cap}席に`);
    }
    if (notices.length === 0) return next;
    const now = Date.now();
    next.settingsNotice = `ルームマスターが${notices.join("、")}変更しました`;
    next.settingsUpdatedAt = now;
    next.updatedAt = now;
    return next;
  }

  if (update.joinGallery) {
    if (next.galleryCapacity <= 0) return "gallery_unavailable";
    for (const team of next.teams) {
      team.members = team.members.filter((member) => member.id !== update.memberId);
    }
    const existing = next.gallery.find((item) => item.id === update.memberId);
    if (existing) {
      if (memberName) {
        existing.name = memberName;
        syncHostName(next, update.memberId, memberName);
      }
    } else {
      if (!memberName) return "name_required";
      if (next.gallery.length >= next.galleryCapacity) return "gallery_full";
      next.gallery.push({
        id: update.memberId,
        name: memberName,
        joinedAt: Date.now(),
      });
      syncHostName(next, update.memberId, memberName);
    }
    next.updatedAt = Date.now();
    return next;
  }

  const team = next.teams.find((item) => item.name === update.teamName);
  if (!team) return room;

  next.gallery = next.gallery.filter((item) => item.id !== update.memberId);
  for (const other of next.teams) {
    if (other.name === team.name) continue;
    other.members = other.members.filter((member) => member.id !== update.memberId);
  }

  let member = team.members.find((item) => item.id === update.memberId);
  if (!member) {
    if (!memberName) return "name_required";
    if (team.members.length >= TEAM_MAX_MEMBERS) return "team_full";
    member = emptyMember(update.memberId, memberName);
    team.members.push(member);
    syncHostName(next, update.memberId, memberName);
  } else if (memberName) {
    member.name = memberName;
    syncHostName(next, update.memberId, memberName);
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

export type TeamStatusUpdate = {
  teamName: string;
  memberId: string;
  memberName?: string;
  difficulty?: Difficulty | null;
  current?: number;
  total?: number;
  combo?: number;
  xp?: number;
  lastResult?: LastResult;
  finished?: boolean;
};

export function teamXp(team: TeamStatus): number {
  return team.members.reduce((sum, member) => sum + member.xp, 0);
}

export function teamFinished(team: TeamStatus): boolean {
  return team.members.length > 0 && team.members.every((member) => member.finished);
}

export function memberStatusLabel(member: TeamMember): string {
  if (member.finished) return "完了";
  if (member.total <= 0) return "待機中";
  if (member.lastResult === "correct") return "正解";
  if (member.lastResult === "wrong") return "不正解";
  return "回答中";
}

const FETCH_MS = 8000;

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function createRoom(
  teamNames: string[],
  timeLimitSeconds: number | null = null,
  options: CreateRoomOptions = {},
): Promise<Room> {
  const res = await fetch("/api/nsd/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamNames,
      timeLimitSeconds,
      galleryCapacity: options.galleryCapacity,
      host: options.host,
    }),
    signal: AbortSignal.timeout(FETCH_MS),
  });
  if (!res.ok) {
    const body = await readJson(res);
    throw new Error(
      typeof body.error === "string" ? body.error : "部屋を作成できませんでした",
    );
  }
  return (await res.json()) as Room;
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const res = await fetch(`/api/nsd/rooms/${encodeURIComponent(id)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_MS),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("部屋を取得できませんでした");
  return (await res.json()) as Room;
}

export async function updateTeamStatus(
  roomId: string,
  update: RoomUpdate,
): Promise<Room> {
  const res = await fetch(`/api/nsd/rooms/${encodeURIComponent(roomId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
    signal: AbortSignal.timeout(FETCH_MS),
  });
  if (!res.ok) {
    const body = await readJson(res);
    throw new Error(
      typeof body.error === "string" ? body.error : "状況を送れませんでした",
    );
  }
  return (await res.json()) as Room;
}

export async function updateRoomSettings(
  roomId: string,
  memberId: string,
  settings: RoomSettingsPatch,
): Promise<Room> {
  return updateTeamStatus(roomId, {
    teamName: "",
    memberId,
    settings,
  });
}
