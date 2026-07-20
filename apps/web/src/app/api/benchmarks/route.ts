import {NextResponse} from "next/server";
import {benchmarkSamples} from "@/lib/catalog";
export async function GET(){return NextResponse.json({generatedAt:new Date().toISOString(),disclaimer:"Sample development results; run local benchmark for authoritative measurements.",results:benchmarkSamples})}
