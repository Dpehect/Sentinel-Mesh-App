import type { Asset, AttackPath, Finding, Relation, ScanResult } from "@sentinel/security-core";
import { getPool } from "./client";

export type ProjectRow = { id:string; name:string; repositoryUrl:string; defaultBranch:string; createdAt:string; latestScore:number|null; latestScanAt:string|null };
export type ScanRow = { id:string; projectId:string; repositoryUrl:string; status:string; score:number|null; branch:string|null; startedAt:string; completedAt:string|null; findingCount:number };

const DEMO_ORG_SLUG = "sentinel-demo";

async function organizationId(){
  const pool=getPool();
  const result=await pool.query(`select id from organizations where slug=$1 limit 1`,[DEMO_ORG_SLUG]);
  if(result.rows[0]) return result.rows[0].id as string;
  const created=await pool.query(`insert into organizations(name,slug) values($1,$2) returning id`,["Sentinel Workspace",DEMO_ORG_SLUG]);
  return created.rows[0].id as string;
}

export async function listProjects():Promise<ProjectRow[]>{
  const pool=getPool();
  const result=await pool.query(`
    select p.id,p.name,p.repository_url as "repositoryUrl",p.default_branch as "defaultBranch",p.created_at as "createdAt",
      latest.score as "latestScore",latest.completed_at as "latestScanAt"
    from projects p
    left join lateral (select score,completed_at from scans where project_id=p.id and status='complete' order by completed_at desc nulls last limit 1) latest on true
    order by p.created_at desc`);
  return result.rows;
}

export async function createProject(input:{name:string;repositoryUrl:string;defaultBranch?:string}){
  const pool=getPool(); const org=await organizationId();
  const result=await pool.query(`insert into projects(organization_id,name,repository_url,default_branch) values($1,$2,$3,$4) returning id,name,repository_url as "repositoryUrl",default_branch as "defaultBranch",created_at as "createdAt"`,[org,input.name,input.repositoryUrl,input.defaultBranch??"main"]);
  return result.rows[0];
}

export async function findOrCreateProject(repositoryUrl:string){
  const pool=getPool();
  const existing=await pool.query(`select id,name,repository_url as "repositoryUrl" from projects where repository_url=$1 limit 1`,[repositoryUrl]);
  if(existing.rows[0]) return existing.rows[0];
  const parts=repositoryUrl.replace(/\.git$/,'').split('/').filter(Boolean); const name=parts.slice(-2).join('/')||"Imported repository";
  return createProject({name,repositoryUrl});
}

export async function persistScanResult(result:ScanResult, projectId?:string, metadata?:{branch?:string;commitSha?:string}){
  const pool=getPool(); const project=projectId?{id:projectId}:await findOrCreateProject(result.repository);
  const client=await pool.connect();
  try{
    await client.query('begin');
    const scan=await client.query(`insert into scans(project_id,status,commit_sha,branch,score,started_at,completed_at) values($1,'complete',$2,$3,$4,$5,$6) returning id`,[project.id,metadata?.commitSha??null,metadata?.branch??'main',result.score,result.startedAt,result.completedAt]);
    const scanId=scan.rows[0].id as string;
    for(const f of result.findings){const e=f.evidence[0]; await client.query(`insert into findings(scan_id,fingerprint,rule_id,title,severity,confidence,category,scanner,file_path,line,status,payload) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open',$11)`,[scanId,f.fingerprint,f.ruleId,f.title,f.severity,f.confidence,f.category,f.scanner,e?.file??null,e?.line??null,JSON.stringify(f)]);}
    for(const a of result.assets) await client.query(`insert into assets(scan_id,external_id,type,name,exposure,criticality,metadata) values($1,$2,$3,$4,$5,$6,$7)`,[scanId,a.id,a.type,a.name,a.exposure,a.criticality,JSON.stringify({...a.metadata,trustZone:a.trustZone,minimumPrivilege:a.minimumPrivilege,dataSensitivity:a.dataSensitivity,path:a.path})]);
    for(const r of result.relations) await client.query(`insert into relations(scan_id,source_external_id,target_external_id,kind,evidence,payload) values($1,$2,$3,$4,$5,$6)`,[scanId,r.from,r.to,r.kind,r.evidence??null,JSON.stringify(r)]);
    for(const p of result.attackPaths) await client.query(`insert into attack_paths(scan_id,title,score,likelihood,impact,payload) values($1,$2,$3,$4,$5,$6)`,[scanId,p.title,p.score,p.likelihood,p.impact,JSON.stringify(p)]);
    await client.query('commit'); return scanId;
  }catch(error){await client.query('rollback'); throw error} finally{client.release()}
}

export async function listScans(limit=30):Promise<ScanRow[]>{
  const pool=getPool(); const result=await pool.query(`select s.id,s.project_id as "projectId",p.repository_url as "repositoryUrl",s.status,s.score,s.branch,s.started_at as "startedAt",s.completed_at as "completedAt",count(f.id)::int as "findingCount" from scans s join projects p on p.id=s.project_id left join findings f on f.scan_id=s.id group by s.id,p.repository_url order by s.started_at desc limit $1`,[limit]); return result.rows;
}

export async function latestScanResult():Promise<ScanResult|null>{
 const pool=getPool(); const latest=await pool.query(`select s.id,p.repository_url,s.score,s.started_at,s.completed_at from scans s join projects p on p.id=s.project_id where s.status='complete' order by s.completed_at desc nulls last limit 1`); if(!latest.rows[0]) return null; const row=latest.rows[0]; const id=row.id;
 const [f,a,r,p]=await Promise.all([pool.query(`select payload from findings where scan_id=$1`,[id]),pool.query(`select external_id,type,name,exposure,criticality,metadata from assets where scan_id=$1`,[id]),pool.query(`select id,source_external_id,target_external_id,kind,evidence,payload from relations where scan_id=$1`,[id]),pool.query(`select id,title,score,likelihood,impact,payload from attack_paths where scan_id=$1 order by score desc`,[id])]);
 return {repository:row.repository_url,startedAt:new Date(row.started_at).toISOString(),completedAt:new Date(row.completed_at).toISOString(),score:row.score,findings:f.rows.map(x=>x.payload as Finding),assets:a.rows.map(x=>({id:x.external_id,type:x.type,name:x.name,exposure:x.exposure,criticality:x.criticality,trustZone:x.metadata?.trustZone,minimumPrivilege:x.metadata?.minimumPrivilege,dataSensitivity:x.metadata?.dataSensitivity,path:x.metadata?.path,metadata:x.metadata} as Asset)),relations:r.rows.map(x=>Object.keys(x.payload??{}).length?x.payload as Relation:({id:x.id,from:x.source_external_id,to:x.target_external_id,kind:x.kind,evidence:x.evidence} as Relation)),attackPaths:p.rows.map(x=>x.payload as AttackPath)};
}

export async function dashboardSnapshot(){
 const pool=getPool(); const [projects,scans,findings]=await Promise.all([pool.query(`select count(*)::int count from projects`),pool.query(`select count(*)::int count from scans`),pool.query(`select severity,count(*)::int count from findings where status='open' group by severity`)]); return {projectCount:projects.rows[0].count,scanCount:scans.rows[0].count,severityCounts:Object.fromEntries(findings.rows.map(x=>[x.severity,x.count]))};
}

export async function recordWebhookDelivery(input:{deliveryId:string;event:string;action?:string;installationId?:number;repositoryFullName?:string;payload:unknown}){
 const pool=getPool(); const r=await pool.query(`insert into webhook_deliveries(delivery_id,event,action,installation_id,repository_full_name,payload) values($1,$2,$3,$4,$5,$6) on conflict(delivery_id) do nothing returning id`,[input.deliveryId,input.event,input.action??null,input.installationId??null,input.repositoryFullName??null,JSON.stringify(input.payload)]); return {inserted:Boolean(r.rows[0]),id:r.rows[0]?.id};
}
export async function markWebhookProcessed(deliveryId:string,status:"processed"|"ignored"|"failed",error?:string){const pool=getPool();await pool.query(`update webhook_deliveries set status=$2,error=$3,processed_at=now() where delivery_id=$1`,[deliveryId,status,error??null]);}
export async function upsertGitHubInstallation(input:{installationId:number;accountLogin:string;accountType:string;permissions?:unknown;repositorySelection?:string}){const pool=getPool();const org=await organizationId();const r=await pool.query(`insert into github_installations(organization_id,installation_id,account_login,account_type,permissions,repository_selection) values($1,$2,$3,$4,$5,$6) on conflict(installation_id) do update set account_login=excluded.account_login,account_type=excluded.account_type,permissions=excluded.permissions,repository_selection=excluded.repository_selection,updated_at=now() returning *`,[org,input.installationId,input.accountLogin,input.accountType,JSON.stringify(input.permissions??{}),input.repositorySelection??null]);return r.rows[0];}
export async function upsertGitHubRepository(input:{installationId:number;githubRepositoryId:number;owner:string;name:string;fullName:string;defaultBranch:string;private:boolean;projectId?:string}){const pool=getPool();const install=await pool.query(`select id from github_installations where installation_id=$1`,[input.installationId]);if(!install.rows[0])throw new Error("GitHub installation not found");const r=await pool.query(`insert into github_repositories(installation_id,project_id,github_repository_id,owner,name,full_name,default_branch,private) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(github_repository_id) do update set project_id=coalesce(excluded.project_id,github_repositories.project_id),default_branch=excluded.default_branch,private=excluded.private,updated_at=now() returning *`,[install.rows[0].id,input.projectId??null,input.githubRepositoryId,input.owner,input.name,input.fullName,input.defaultBranch,input.private]);return r.rows[0];}
export async function listWebhookDeliveries(limit=50){const pool=getPool();const r=await pool.query(`select delivery_id as "deliveryId",event,action,repository_full_name as "repositoryFullName",status,error,received_at as "receivedAt",processed_at as "processedAt" from webhook_deliveries order by received_at desc limit $1`,[limit]);return r.rows;}
export async function listGitHubInstallations(){const pool=getPool();const r=await pool.query(`select installation_id as "installationId",account_login as "accountLogin",account_type as "accountType",repository_selection as "repositorySelection",created_at as "createdAt" from github_installations order by created_at desc`);return r.rows;}
