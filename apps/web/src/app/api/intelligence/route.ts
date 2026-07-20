import {NextResponse} from "next/server";import {analyzeSecurityIntelligence} from "@sentinel/ai-intelligence";import {getLatestResult} from "@/lib/data";import {requireSession} from "@/lib/auth";
export async function GET(){await requireSession();const result=await getLatestResult();return NextResponse.json(analyzeSecurityIntelligence(result),{headers:{"cache-control":"private, max-age=30"}})}
