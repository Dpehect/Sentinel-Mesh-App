import { NextResponse } from "next/server";
import {
  createSystemBackup,
  loadLatestBackup
} from "@/lib/release-readiness";

export async function GET() {
  const backup = await loadLatestBackup();
  return NextResponse.json({
    available: Boolean(backup),
    manifest: backup?.manifest ?? null
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const backup = await createSystemBackup(
      body.actor ?? "local-owner"
    );

    return NextResponse.json({
      manifest: backup.manifest
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
