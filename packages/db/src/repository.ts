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
    for(const a of result.assets) await client.query(`insert into assets(scan_id,external_id,type,name,exposure,criticality,metadata) values($1,$2,$3,$4,$5,$6,$7)`,[scanId,a.id,a.type,a.name,a.exposure,a.criticality,JSON.stringify(a.metadata)]);
    for(const r of result.relations) await client.query(`insert into relations(scan_id,source_external_id,target_external_id,kind,evidence) values($1,$2,$3,$4,$5,$6)`,[scanId,r.from,r.to,r.kind,r.evidence??null]);
    for(const p of result.attackPaths) await client.query(`insert into attack_paths(scan_id,title,score,likelihood,impact,payload) values($1,$2,$3,$4,$5,$6)`,[scanId,p.title,p.score,p.likelihood,p.impact,JSON.stringify(p)]);
    await client.query('commit'); return scanId;
  }catch(error){await client.query('rollback'); throw error} finally{client.release()}
}

export async function listScans(limit=30):Promise<ScanRow[]>{
  const pool=getPool(); const result=await pool.query(`select s.id,s.project_id as "projectId",p.repository_url as "repositoryUrl",s.status,s.score,s.branch,s.started_at as "startedAt",s.completed_at as "completedAt",count(f.id)::int as "findingCount" from scans s join projects p on p.id=s.project_id left join findings f on f.scan_id=s.id group by s.id,p.repository_url order by s.started_at desc limit $1`,[limit]); return result.rows;
}

export async function latestScanResult():Promise<ScanResult|null>{
 const pool=getPool(); const latest=await pool.query(`select s.id,p.repository_url,s.score,s.started_at,s.completed_at from scans s join projects p on p.id=s.project_id where s.status='complete' order by s.completed_at desc nulls last limit 1`); if(!latest.rows[0]) return null; const row=latest.rows[0]; const id=row.id;
 const [f,a,r,p]=await Promise.all([pool.query(`select payload from findings where scan_id=$1`,[id]),pool.query(`select external_id,type,name,exposure,criticality,metadata from assets where scan_id=$1`,[id]),pool.query(`select id,source_external_id,target_external_id,kind,evidence from relations where scan_id=$1`,[id]),pool.query(`select id,title,score,likelihood,impact,payload from attack_paths where scan_id=$1 order by score desc`,[id])]);
 return {repository:row.repository_url,startedAt:new Date(row.started_at).toISOString(),completedAt:new Date(row.completed_at).toISOString(),score:row.score,findings:f.rows.map(x=>x.payload as Finding),assets:a.rows.map(x=>({id:x.external_id,type:x.type,name:x.name,exposure:x.exposure,criticality:x.criticality,metadata:x.metadata} as Asset)),relations:r.rows.map(x=>({id:x.id,from:x.source_external_id,to:x.target_external_id,kind:x.kind,evidence:x.evidence} as Relation)),attackPaths:p.rows.map(x=>x.payload as AttackPath)};
}

export async function dashboardSnapshot(){
 const pool=getPool(); const [projects,scans,findings]=await Promise.all([pool.query(`select count(*)::int count from projects`),pool.query(`select count(*)::int count from scans`),pool.query(`select severity,count(*)::int count from findings where status='open' group by severity`)]); return {projectCount:projects.rows[0].count,scanCount:scans.rows[0].count,severityCounts:Object.fromEntries(findings.rows.map(x=>[x.severity,x.count]))};
}
