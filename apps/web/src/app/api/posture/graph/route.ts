import {NextResponse} from "next/server";
import {requireSession} from "@/lib/auth";
import {postureAttackPaths, postureGraph} from "@/lib/posture-demo";

export async function GET(){
  await requireSession();
  return NextResponse.json(
    {graph:postureGraph,attackPaths:postureAttackPaths},
    {headers:{"Cache-Control":"private, no-store"}}
  );
}
