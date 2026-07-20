import {NextResponse} from "next/server";
import {demoPostureReport} from "@sentinel/posture-intelligence";

export async function GET(){
  return NextResponse.json(demoPostureReport,{headers:{"Cache-Control":"no-store"}});
}
