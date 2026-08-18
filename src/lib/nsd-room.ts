import type { Difficulty } from "@/lib/next-server-day";

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

export type Room = {
  id: string;
  teams: TeamStatus[];
  updatedAt: number;
};

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

export async function createRoom(teamNames: string[]): Promise<Room> {
  const res = await fetch("/api/nsd/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamNames }),
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
  update: TeamStatusUpdate,
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
