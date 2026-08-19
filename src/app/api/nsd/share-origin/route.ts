import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicOrigin(value: string | undefined): string | null {
  const origin = value?.trim().replace(/\/$/, "") ?? "";
  if (!/^https:\/\//i.test(origin)) return null;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return null;
  return origin;
}

export async function GET() {
  const fromEnv = publicOrigin(process.env.APP_URL);
  if (fromEnv) {
    return NextResponse.json({ origin: fromEnv });
  }

  try {
    const origin = publicOrigin(
      readFileSync(join(process.cwd(), "data", "share-origin.txt"), "utf8"),
    );
    if (!origin || !/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin)) {
      return NextResponse.json({ origin: null });
    }
    return NextResponse.json({ origin });
  } catch {
    return NextResponse.json({ origin: null });
  }
}
