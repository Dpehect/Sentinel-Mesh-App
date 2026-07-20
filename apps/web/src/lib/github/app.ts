import { createSign } from "node:crypto";

const apiBase = "https://api.github.com";

function b64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function createGitHubAppJwt(now = Math.floor(Date.now() / 1000)) {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) throw new Error("GitHub App credentials are not configured");
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${b64url(signature)}`;
}

async function githubFetch(path: string, init: RequestInit & { token?: string } = {}) {
  const token = init.token ?? createGitHubAppJwt();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "sentinel-mesh",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

export async function getInstallationToken(installationId: number) {
  const data = await githubFetch(`/app/installations/${installationId}/access_tokens`, { method: "POST" });
  return data.token as string;
}

export async function listInstallationRepositories(installationId: number) {
  const token = await getInstallationToken(installationId);
  const data = await githubFetch("/installation/repositories?per_page=100", { token });
  return data.repositories as Array<{ id:number; name:string; full_name:string; private:boolean; default_branch:string; owner:{login:string} }>;
}

export async function createCheckRun(input:{installationId:number;owner:string;repo:string;name:string;headSha:string;status:"queued"|"in_progress"|"completed";conclusion?:"success"|"failure"|"neutral"|"cancelled"|"timed_out"|"action_required";title:string;summary:string;detailsUrl?:string}){
  const token=await getInstallationToken(input.installationId);
  return githubFetch(`/repos/${input.owner}/${input.repo}/check-runs`,{method:"POST",token,headers:{"content-type":"application/json"},body:JSON.stringify({name:input.name,head_sha:input.headSha,status:input.status,conclusion:input.conclusion,details_url:input.detailsUrl,output:{title:input.title,summary:input.summary}})});
}

export async function compareCommits(installationId:number,owner:string,repo:string,base:string,head:string){
  const token=await getInstallationToken(installationId);
  const data=await githubFetch(`/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,{token});
  return {files:(data.files??[]).map((f:{filename:string;status:string})=>({filename:f.filename,status:f.status})),baseSha:data.base_commit?.sha as string,headSha:data.merge_base_commit?.sha?head:data.commits?.at(-1)?.sha??head};
}
