import { builtinScan } from "./builtin";
import { semgrep, gitleaks, osv } from "./adapters";
import { discover } from "./discovery";
import { buildAttackPaths, securityScore, type Finding, type ScanResult } from "@sentinel/security-core";

function dedupe(findings:Finding[]){
  const map=new Map<string,Finding>();
  for(const f of findings){const key=f.fingerprint||`${f.ruleId}:${f.evidence[0]?.file}:${f.evidence[0]?.line}`;const prev=map.get(key);if(!prev||f.confidence>prev.confidence)map.set(key,f)}
  return [...map.values()];
}

export async function scanRepository(repositoryPath:string,repositoryUrl:string,log=(x:string)=>void console.log(x)):Promise<ScanResult>{
  const startedAt=new Date().toISOString();
  log("Running deterministic source scanner");
  const legacy=await builtinScan(repositoryPath);
  log("Running TypeScript AST and framework-aware analysis");
  const discovered=await discover(repositoryPath);
  const findings:Finding[]=[...legacy,...discovered.findings];
  for(const [name,fn] of [["Semgrep",semgrep],["Gitleaks",gitleaks],["OSV",osv]] as const){log(`Running optional ${name}`);findings.push(...await fn(repositoryPath))}
  const normalized=dedupe(findings);
  for(const f of normalized){if(!f.assetId){const file=f.evidence[0]?.file;if(file)f.assetId=`file:${file}`}}
  log(`Correlating ${normalized.length} findings with ${discovered.assets.length} assets`);
  const attackPaths=buildAttackPaths(discovered.assets,discovered.relations,normalized);
  return {repository:repositoryUrl,startedAt,completedAt:new Date().toISOString(),findings:normalized,assets:discovered.assets,relations:discovered.relations,attackPaths,score:securityScore(normalized,discovered.assets)};
}
export * from "./builtin";
export * from "./adapters";
export * from "./discovery";
export * from "./ast-analyzer";
