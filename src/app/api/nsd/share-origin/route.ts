import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const origin = readFileSync(
      join(process.cwd(), "data", "share-origin.txt"),
      "utf8",
    ).trim();
    if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)) {
      return NextResponse.json({ origin: null });
    }
    return NextResponse.json({ origin });
  } catch {
    return NextResponse.json({ origin: null });
  }
}
