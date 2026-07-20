import { NextResponse } from "next/server";
import { rolloutControlPlane } from "@/lib/rollout-control";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "checkpoint") {
      const checkpoint = await rolloutControlPlane.createCheckpoint(
        body.rolloutId,
        body.actor,
        body.expectedVersion
      );
      return NextResponse.json({ checkpoint });
    }

    const record = await rolloutControlPlane.transition(
      body.rolloutId,
      body.action,
      body.actor,
      body.expectedVersion
    );

    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 409 }
    );
  }
}
