import { NextResponse } from "next/server";
import { getRoom, patchTeam } from "@/lib/nsd-store";
import type { RoomUpdate } from "@/lib/nsd-room";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const room = await getRoom(id);
  if (!room) {
    return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(room);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as RoomUpdate | null;

  if (!body || typeof body.memberId !== "string" || !body.memberId.trim()) {
    return NextResponse.json({ error: "memberId が必要です" }, { status: 400 });
  }
  if (
    !body.settings &&
    !body.joinGallery &&
    (typeof body.teamName !== "string" || !body.teamName.trim())
  ) {
    return NextResponse.json({ error: "teamName が必要です" }, { status: 400 });
  }

  const room = await patchTeam(id, {
    ...body,
    teamName: body.teamName?.trim() ?? "",
    memberId: body.memberId.trim(),
    joinGallery: Boolean(body.joinGallery),
  });
  if (room === "name_required") {
    return NextResponse.json({ error: "表示名を入力してください" }, { status: 400 });
  }
  if (room === "team_full") {
    return NextResponse.json({ error: "このチームは満員です" }, { status: 400 });
  }
  if (room === "gallery_full") {
    return NextResponse.json({ error: "ギャラリー枠は満員です" }, { status: 400 });
  }
  if (room === "gallery_unavailable") {
    return NextResponse.json({ error: "この部屋にギャラリー枠はありません" }, { status: 400 });
  }
  if (room === "not_master") {
    return NextResponse.json({ error: "設定を変えられるのはルームマスターだけです" }, { status: 403 });
  }
  if (room === "quiz_started") {
    return NextResponse.json({ error: "クイズ開始後は制限時間を変えられません" }, { status: 400 });
  }
  if (room === "gallery_occupied") {
    return NextResponse.json({ error: "ギャラリーの人数より席を減らせません" }, { status: 400 });
  }
  if (!room) {
    return NextResponse.json(
      { error: "部屋またはチームが見つかりません" },
      { status: 404 },
    );
  }
  return NextResponse.json(room);
}
