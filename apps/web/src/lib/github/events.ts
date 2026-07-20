export type GitHubWebhook = {
  deliveryId:string; event:string; action?:string; installationId?:number; repositoryFullName?:string; payload:Record<string,unknown>;
};

export function parseWebhook(headers:Headers,payload:Record<string,any>):GitHubWebhook{
  return {deliveryId:headers.get("x-github-delivery")??crypto.randomUUID(),event:headers.get("x-github-event")??"unknown",action:payload.action,installationId:payload.installation?.id,repositoryFullName:payload.repository?.full_name,payload};
}

export function scanRequestFromWebhook(event:GitHubWebhook){
  const p=event.payload as any;
  if(event.event==="push") return {repositoryUrl:p.repository?.clone_url,branch:(p.ref??"").replace("refs/heads/",""),commitSha:p.after,changedFiles:[...(p.commits??[]).flatMap((c:any)=>[...(c.added??[]),...(c.modified??[]),...(c.removed??[])])],reason:"push"};
  if(event.event==="pull_request"&&["opened","synchronize","reopened","ready_for_review"].includes(event.action??"")) return {repositoryUrl:p.repository?.clone_url,branch:p.pull_request?.head?.ref,commitSha:p.pull_request?.head?.sha,baseSha:p.pull_request?.base?.sha,changedFiles:[],reason:"pull_request",pullRequestNumber:p.number};
  return null;
}
