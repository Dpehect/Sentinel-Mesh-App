import { NextResponse } from "next/server";
import { getScanJob } from "@/lib/scan-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getScanJob(id);
  if (!job) return NextResponse.json({ error: "Scan job not found" }, { status: 404 });
  return NextResponse.json(job, { headers: { "Cache-Control": "no-store" } });
}
