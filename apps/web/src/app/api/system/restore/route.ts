import { NextResponse } from "next/server";
import { restoreLatestBackup } from "@/lib/release-readiness";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await restoreLatestBackup(
      Boolean(body.overwrite)
    );
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 409 }
    );
  }
}
