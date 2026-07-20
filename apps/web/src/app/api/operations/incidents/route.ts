import { NextResponse } from "next/server";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export async function GET() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();
  return NextResponse.json({ incidents: snapshot.incidents });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "transition") {
      const incident = await operationsCenter.transitionIncident(
        body.actorRole,
        body.incidentId,
        body.status,
        body.expectedVersion
      );
      return NextResponse.json({ incident });
    }

    const incident = await operationsCenter.createIncident(
      body.actorRole,
      body.incident
    );
    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 409 }
    );
  }
}
