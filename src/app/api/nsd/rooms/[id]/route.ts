import { NextResponse } from "next/server";
import { getRoom, patchTeam } from "@/lib/nsd-store";
import type { TeamStatusUpdate } from "@/lib/nsd-room";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const room = getRoom(id);
  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(room);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as TeamStatusUpdate | null;

  if (!body || typeof body.teamName !== "string" || !body.teamName.trim()) {
    return NextResponse.json({ error: "teamName が必要です" }, { status: 400 });
  }
  if (typeof body.memberId !== "string" || !body.memberId.trim()) {
    return NextResponse.json({ error: "memberId が必要です" }, { status: 400 });
  }

  const room = await patchTeam(id, {
    ...body,
    teamName: body.teamName.trim(),
    memberId: body.memberId.trim(),
  });
  if (room === "name_required") {
    return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 });
  }
  if (room === "team_full") {
    return NextResponse.json({ error: "このチームは満員です" }, { status: 400 });
  }
  if (!room) {
    return NextResponse.json(
      { error: "部屋またはチームが見つかりません" },
      { status: 404 },
    );
  }
  return NextResponse.json(room);
}
