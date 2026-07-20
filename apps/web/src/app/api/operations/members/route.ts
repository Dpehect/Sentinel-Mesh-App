import { NextResponse } from "next/server";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export async function GET() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();
  return NextResponse.json({ members: snapshot.members });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "update-role") {
      const member = await operationsCenter.updateMemberRole(
        body.actorRole,
        body.memberId,
        body.role
      );
      return NextResponse.json({ member });
    }

    const member = await operationsCenter.addMember(
      body.actorRole,
      body.member
    );
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 403 }
    );
  }
}
