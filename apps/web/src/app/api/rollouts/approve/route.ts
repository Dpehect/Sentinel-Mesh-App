import { NextResponse } from "next/server";
import { rolloutControlPlane } from "@/lib/rollout-control";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await rolloutControlPlane.decideApproval(body);
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 409 }
    );
  }
}
