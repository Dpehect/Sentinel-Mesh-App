import { NextResponse } from "next/server";
import { getSystemDiagnostics } from "@/lib/release-readiness";

export async function GET() {
  return NextResponse.json({
    diagnostics: await getSystemDiagnostics()
  });
}
