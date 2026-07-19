import { NextResponse } from "next/server";
import { demoScan, scoreScan } from "@sentinel/security-core";
import { z } from "zod";

const schema = z.object({ repositoryUrl: z.string().url().refine((value) => value.startsWith("https://github.com/"), "Use a public GitHub URL") });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const scan = demoScan(parsed.data.repositoryUrl);
  return NextResponse.json({ ...scan, score: scoreScan(scan.findings, scan.assets) });
}
