import {NextResponse} from "next/server";
import {scannerCatalog} from "@/lib/catalog";
export async function GET(){return NextResponse.json({schemaVersion:"1.0",items:scannerCatalog})}
