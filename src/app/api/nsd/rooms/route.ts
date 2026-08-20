import { NextResponse } from "next/server";
import { normalizeTimeLimit } from "@/lib/next-server-day";
import { createRoom } from "@/lib/nsd-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    teamNames?: unknown;
    timeLimitSeconds?: unknown;
  } | null;

  const teamNames = Array.isArray(body?.teamNames)
    ? body.teamNames
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim())
        .filter(Boolean)
    : [];

  if (teamNames.length < 2 || teamNames.length > 8) {
    return NextResponse.json(
      { error: "チーム数は2〜8です" },
      { status: 400 },
    );
  }

  if (new Set(teamNames).size !== teamNames.length) {
    return NextResponse.json(
      { error: "チーム名が重複しています" },
      { status: 400 },
    );
  }

  const timeLimitSeconds = normalizeTimeLimit(body?.timeLimitSeconds);
  const room = await createRoom(teamNames, timeLimitSeconds);
  return NextResponse.json(room);
}
