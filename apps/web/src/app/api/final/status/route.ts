import { NextResponse } from "next/server";
import { getFinalStatus } from "@/lib/final-status";

export async function GET() {
  const status = await getFinalStatus();
  return NextResponse.json({ status }, {
    status: status.ready ? 200 : 503
  });
}
