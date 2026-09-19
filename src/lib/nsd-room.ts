import {
  DIFFICULTY_LABELS,
  QUESTION_TIME_LIMIT_SECONDS,
  type Difficulty,
} from "@/lib/next-server-day";
import { normalizeOutfit, type MascotOutfit } from "@/lib/mascot";

export type LastResult = "correct" | "wrong" | null;

/** One answered question's outcome, in question order (no questionId needed). */
export type AnswerLogEntry = { correct: boolean; xp: number };

/** A completed difficulty run, archived when the room master advances to the next one. */
export type RunHistoryEntry = {
  difficulty: Difficulty;
  xp: number;
  correctCount: number;
  total: number;
};

export type TeamMember = {
  id: string;
  name: string;
  current: number;
  total: number;
  combo: number;
  xp: number;
  lastResult: LastResult;
  finished: boolean;
  outfit: MascotOutfit | null;
  joinedAt: number;
  updatedAt: number;
  answers: AnswerLogEntry[];
  runHistory: RunHistoryEntry[];
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
  host: RoomHost | null;
  galleryCapacity: number;
  gallery: GalleryMember[];
  settingsNotice: string | null;
  settingsUpdatedAt: number | null;
  /** Highest question index (0-based) the room master has released past standings. */
  releasedQuestion: number;
  /** Room master has pressed 結果発表へ for this run's drumroll/ranking reveal. */
  resultsReleased: boolean;
};

export const TEAM_MAX_MEMBERS = 8;
export const GALLERY_MAX = 20;
export const DEFAULT_GALLERY_CAPACITY = 8;
export const ROOM_CODE_LENGTH = 4;

export function normalizeRoomCode(value: string): string {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ROOM_CODE_LENGTH);
}

export type CreateRoomOptions = {
  galleryCapacity?: number;
  host?: RoomHost | null;
};

export type RoomSettingsPatch = {
  galleryCapacity?: number;
  difficulty?: Difficulty;
  /** Room master releasing everyone past this question's standings. */
  releaseQuestion?: number;
  /** Room master advancing every team to the next difficulty in this same room. */
  advanceDifficulty?: Difficulty;
  /** Room master starting this run's drumroll/ranking reveal for everyone at once. */
  revealResults?: boolean;
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
    releasedQuestion:
      typeof room.releasedQuestion === "number" ? room.releasedQuestion : -1,
    resultsReleased: Boolean(room.resultsReleased),
  };
}

export function isHost(room: Room, memberId: string | null | undefined): boolean {
  return Boolean(memberId && room.host?.memberId === memberId);
}

export function lockedDifficulty(room: Room): Difficulty | null {
  return room.teams.find((team) => team.difficulty)?.difficulty ?? null;
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

function isDifficulty(value: unknown): value is Difficulty {
  return (
    value === "beginner" || value === "intermediate" || value === "advanced"
  );
}

function lockRoomDifficulty(room: Room, difficulty: Difficulty) {
  for (const team of room.teams) {
    team.difficulty = difficulty;
  }
  room.settingsNotice = `ルームマスターが${DIFFICULTY_LABELS[difficulty].label}でスタートしました`;
  room.settingsUpdatedAt = Date.now();
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
    outfit: null,
    joinedAt: now,
    updatedAt: now,
    answers: [],
    runHistory: [],
  };
}

/**
 * Resets a member to a fresh run's starting state, preserving identity
 * (id/name/outfit/joinedAt) and runHistory — used when the room master
 * advances the whole room to the next difficulty.
 */
export function resetMemberForNewRun(member: TeamMember): TeamMember {
  return {
    ...member,
    current: 0,
    total: 0,
    combo: 0,
    xp: 0,
    lastResult: null,
    finished: false,
    answers: [],
    updatedAt: Date.now(),
  };
}

/**
 * Room master only: archives every member's just-finished run into their
 * runHistory, then resets everyone and moves every team to the next
 * difficulty at once — unlike lockRoomDifficulty, this is allowed to change
 * an already-set difficulty.
 */
function advanceRoomDifficulty(room: Room, difficulty: Difficulty) {
  for (const team of room.teams) {
    team.members = team.members.map((member) => {
      const archived =
        member.total > 0
          ? {
              ...member,
              runHistory: [
                ...(member.runHistory ?? []),
                {
                  difficulty: team.difficulty as Difficulty,
                  xp: member.xp,
                  correctCount: (member.answers ?? []).filter(
                    (answer) => answer.correct,
                  ).length,
                  total: member.total,
                },
              ],
            }
          : member;
      return resetMemberForNewRun(archived);
    });
    team.difficulty = difficulty;
    team.updatedAt = Date.now();
  }
  // A run's release signal must not leak into the next run's very first
  // question — otherwise everyone's first standings screen there would
  // auto-skip instantly, as if the master had already released it.
  room.releasedQuestion = -1;
  // Likewise, the next run needs its own 結果発表へ press before its drumroll —
  // this run's already having been revealed must not carry over.
  room.resultsReleased = false;
  room.settingsNotice = `ルームマスターが${DIFFICULTY_LABELS[difficulty].label}に進みました`;
  room.settingsUpdatedAt = Date.now();
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
    if (update.settings.galleryCapacity !== undefined) {
      const cap = normalizeGalleryCapacity(update.settings.galleryCapacity);
      if (cap < next.gallery.length) return "gallery_occupied";
      next.galleryCapacity = cap;
      notices.push(`ギャラリー枠を${cap}席に`);
    }
    if (isDifficulty(update.settings.difficulty) && !lockedDifficulty(next)) {
      lockRoomDifficulty(next, update.settings.difficulty);
    }
    if (isDifficulty(update.settings.advanceDifficulty)) {
      advanceRoomDifficulty(next, update.settings.advanceDifficulty);
    }
    if (typeof update.settings.releaseQuestion === "number") {
      next.releasedQuestion = Math.max(
        next.releasedQuestion,
        update.settings.releaseQuestion,
      );
    }
    if (update.settings.revealResults) {
      next.resultsReleased = true;
    }
    if (notices.length === 0) {
      next.updatedAt = Date.now();
      return next;
    }
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

  if (update.outfit) {
    member.outfit = normalizeOutfit(update.outfit);
  }

  if (update.difficulty) {
    if (!lockedDifficulty(next)) {
      if (next.host && next.host.memberId !== update.memberId) {
        return "not_master";
      }
      lockRoomDifficulty(next, update.difficulty);
    }
  }
  if (update.current !== undefined) member.current = update.current;
  if (update.total !== undefined) member.total = update.total;
  if (update.combo !== undefined) member.combo = update.combo;
  if (update.xp !== undefined) member.xp = update.xp;
  if (update.lastResult !== undefined) member.lastResult = update.lastResult;
  if (update.finished !== undefined) member.finished = update.finished;
  if (update.answers !== undefined) member.answers = update.answers;

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
  outfit?: MascotOutfit | null;
  difficulty?: Difficulty | null;
  current?: number;
  total?: number;
  combo?: number;
  xp?: number;
  lastResult?: LastResult;
  finished?: boolean;
  answers?: AnswerLogEntry[];
};

export function teamXp(team: TeamStatus): number {
  return team.members.reduce((sum, member) => sum + member.xp, 0);
}

export type RankedPlayer = {
  id: string;
  name: string;
  teamName: string;
  xp: number;
  combo: number;
  current: number;
  total: number;
  finished: boolean;
  outfit: MascotOutfit | null;
  answers: AnswerLogEntry[];
};

/**
 * Every player in the room, flattened out of their teams and sorted the way a
 * Kahoot-style leaderboard is: most XP first, ties broken by who joined earlier
 * so the order stays stable between reveals.
 */
export function roomRanking(room: Room): RankedPlayer[] {
  return room.teams
    .flatMap((team) =>
      team.members.map((member) => ({
        member,
        teamName: team.name,
      })),
    )
    .sort(
      (a, b) =>
        b.member.xp - a.member.xp || a.member.joinedAt - b.member.joinedAt,
    )
    .map(({ member, teamName }) => ({
      id: member.id,
      name: member.name,
      teamName,
      xp: member.xp,
      combo: member.combo,
      current: member.current,
      total: member.total,
      finished: member.finished,
      outfit: member.outfit ?? null,
      answers: member.answers ?? [],
    }));
}

export type PendingPlayer = {
  id: string;
  name: string;
  outfit: MascotOutfit | null;
  /** Gone quiet for a while — excluded from what the reveal waits on. */
  away: boolean;
};

// Must stay comfortably above the question's own time limit: a player still
// legitimately thinking (no network activity yet, but well within their
// allowed time) must never be mistaken for "away" and skipped past. The
// grace period beyond the time limit covers the trip for their own
// timeout/answer sync to land.
const WAIT_STALE_MS = (QUESTION_TIME_LIMIT_SECONDS + 30) * 1000;

/**
 * Other room members (any team — the leaderboard is room-wide) who have not
 * yet answered `questionIndex` (0-based) themselves. Someone whose status
 * hasn't moved in a while is flagged `away` so a closed tab or a player who
 * never started can't stall everyone else's reveal forever.
 */
export function pendingPlayers(
  room: Room,
  memberId: string,
  questionIndex: number,
  now: number = Date.now(),
): PendingPlayer[] {
  const pending: PendingPlayer[] = [];
  for (const team of room.teams) {
    for (const member of team.members) {
      if (member.id === memberId) continue;
      if (member.total <= 0) continue; // hasn't started this quiz yet
      const done =
        member.finished ||
        member.current > questionIndex ||
        (member.current === questionIndex && member.lastResult !== null);
      if (done) continue;
      pending.push({
        id: member.id,
        name: member.name,
        outfit: member.outfit ?? null,
        away: now - member.updatedAt > WAIT_STALE_MS,
      });
    }
  }
  return pending;
}

/** True once no one still active is left to answer `questionIndex`. */
export function readyToReveal(
  room: Room,
  memberId: string,
  questionIndex: number,
  now: number = Date.now(),
): boolean {
  return pendingPlayers(room, memberId, questionIndex, now).every(
    (player) => player.away,
  );
}

export function teamFinished(team: TeamStatus): boolean {
  return team.members.length > 0 && team.members.every((member) => member.finished);
}

export function memberStatusLabel(member: TeamMember): string {
  if (member.finished) return "完了";
  if (member.total <= 0) return "待機中";
  if (member.lastResult !== null) return "回答済み";
  return "回答中";
}

const FETCH_MS = 8000;

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function createRoom(
  teamNames: string[],
  options: CreateRoomOptions = {},
): Promise<Room> {
  const res = await fetch("/api/nsd/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamNames,
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
  const res = await fetch(
    `/api/nsd/rooms/${encodeURIComponent(normalizeRoomCode(id))}`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_MS),
    },
  );
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

/** Room master only: release everyone from this question's standings. */
export async function releaseQuestion(
  roomId: string,
  memberId: string,
  questionIndex: number,
): Promise<Room> {
  return updateRoomSettings(roomId, memberId, {
    releaseQuestion: questionIndex,
  });
}

/** Room master only: archive this run and move every team to the next difficulty. */
export async function advanceDifficulty(
  roomId: string,
  memberId: string,
  next: Difficulty,
): Promise<Room> {
  return updateRoomSettings(roomId, memberId, {
    advanceDifficulty: next,
  });
}

/** Room master only: start this run's drumroll/ranking reveal for everyone at once. */
export async function revealResults(
  roomId: string,
  memberId: string,
): Promise<Room> {
  return updateRoomSettings(roomId, memberId, {
    revealResults: true,
  });
}
