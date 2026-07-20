import {createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {markWebhookProcessed,recordWebhookDelivery,upsertGitHubInstallation,upsertGitHubRepository} from "@sentinel/db";
import {parseWebhook,scanRequestFromWebhook} from "@/lib/github/events";

function verify(body:string,signature:string,secret:string){const expected=`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`;return signature.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected));}

export async function POST(req:Request){
 const body=await req.text(); const secret=process.env.GITHUB_WEBHOOK_SECRET; if(!secret)return NextResponse.json({error:"Webhook secret not configured"},{status:503});
 if(!verify(body,req.headers.get("x-hub-signature-256")??"",secret))return NextResponse.json({error:"Invalid signature"},{status:401});
 const payload=JSON.parse(body); const event=parseWebhook(req.headers,payload); const recorded=await recordWebhookDelivery(event); if(!recorded.inserted)return NextResponse.json({accepted:true,deduplicated:true});
 try{
  if(event.event==="installation"&&payload.installation){await upsertGitHubInstallation({installationId:payload.installation.id,accountLogin:payload.installation.account.login,accountType:payload.installation.account.type,permissions:payload.installation.permissions,repositorySelection:payload.installation.repository_selection});}
  if(["installation_repositories","repository"].includes(event.event)&&payload.repository&&event.installationId){await upsertGitHubRepository({installationId:event.installationId,githubRepositoryId:payload.repository.id,owner:payload.repository.owner.login,name:payload.repository.name,fullName:payload.repository.full_name,defaultBranch:payload.repository.default_branch,private:payload.repository.private});}
  const scan=scanRequestFromWebhook(event);
  if(scan?.repositoryUrl){const response=await fetch(`${process.env.WORKER_URL??"http://localhost:4010"}/jobs`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...scan,installationId:event.installationId,repositoryFullName:event.repositoryFullName})});if(!response.ok)throw new Error(`Worker rejected webhook scan: ${response.status}`);}
  await markWebhookProcessed(event.deliveryId,scan?"processed":"ignored"); return NextResponse.json({accepted:true,event:event.event,scanQueued:Boolean(scan)});
 }catch(error){await markWebhookProcessed(event.deliveryId,"failed",error instanceof Error?error.message:String(error));return NextResponse.json({accepted:false,error:error instanceof Error?error.message:String(error)},{status:500});}
}
