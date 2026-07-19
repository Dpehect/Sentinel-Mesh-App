import { NextResponse } from "next/server";
import { createScanJob } from "@/lib/scan-jobs";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({ repositoryUrl: z.string().url().refine((value) => /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(value), "Use a public GitHub repository URL") });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const job = createScanJob(parsed.data.repositoryUrl);
  return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
}
