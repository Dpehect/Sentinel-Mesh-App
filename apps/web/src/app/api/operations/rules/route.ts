import { NextResponse } from "next/server";
import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export async function GET() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();
  const notifications = await operationsCenter.deriveNotifications();
  return NextResponse.json({
    rules: snapshot.rules,
    notifications
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule = await operationsCenter.createRule(
      body.actorRole,
      body.rule
    );
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
