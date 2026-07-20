import {NextResponse} from "next/server";
import {postureDemo} from "@/lib/posture-demo";
import {requireSession} from "@/lib/auth";

export async function GET(){
  await requireSession();
  return NextResponse.json(postureDemo,{
    headers:{"Cache-Control":"private, no-store"}
  });
}
