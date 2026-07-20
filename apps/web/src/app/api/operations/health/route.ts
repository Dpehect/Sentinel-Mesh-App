import { NextResponse } from "next/server";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export async function GET() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();
  const summary = await operationsCenter.healthSummary();
  return NextResponse.json({
    summary,
    components: snapshot.health
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const health = await operationsCenter.recordHealth(
      body.actorRole,
      body.health
    );
    return NextResponse.json({ health }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 403 }
    );
  }
}
