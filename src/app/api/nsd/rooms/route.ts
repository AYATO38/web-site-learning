import { NextResponse } from "next/server";
import { normalizeGalleryCapacity } from "@/lib/nsd-room";
import { createRoom } from "@/lib/nsd-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    teamNames?: unknown;
    galleryCapacity?: unknown;
    host?: { memberId?: unknown; name?: unknown } | null;
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

  const hostId =
    typeof body?.host?.memberId === "string" ? body.host.memberId.trim() : "";
  const hostName =
    typeof body?.host?.name === "string" ? body.host.name.trim() : "";
  if (!hostId || !hostName) {
    return NextResponse.json(
      { error: "ルームマスターの名前を入力してください" },
      { status: 400 },
    );
  }

  const room = await createRoom(teamNames, {
    galleryCapacity: normalizeGalleryCapacity(body?.galleryCapacity),
    host: { memberId: hostId, name: hostName },
  });
  return NextResponse.json(room);
}
