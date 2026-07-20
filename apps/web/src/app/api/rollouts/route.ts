import { NextResponse } from "next/server";
import {
  ensureDemoRollout,
  rolloutControlPlane
} from "@/lib/rollout-control";

export async function GET() {
  await ensureDemoRollout();
  return NextResponse.json({
    rollouts: await rolloutControlPlane.list()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await rolloutControlPlane.create(body);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
