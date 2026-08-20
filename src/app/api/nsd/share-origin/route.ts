import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { publicAppOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicOrigin(value: string | undefined): string | null {
  const origin = value?.trim().replace(/\/$/, "") ?? "";
  if (!/^https:\/\//i.test(origin)) return null;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return null;
  return origin;
}

export async function GET() {
  try {
    const tunnel = publicOrigin(
      readFileSync(join(process.cwd(), "data", "share-origin.txt"), "utf8"),
    );
    if (tunnel && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(tunnel)) {
      return NextResponse.json({ origin: tunnel });
    }
  } catch {
    /* no tunnel yet */
  }

  return NextResponse.json({ origin: publicAppOrigin() });
}
