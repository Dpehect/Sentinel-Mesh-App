import { NextResponse } from "next/server";
import { getReadinessReport } from "@/lib/release-readiness";

export async function GET() {
  return NextResponse.json({
    report: await getReadinessReport()
  });
}
