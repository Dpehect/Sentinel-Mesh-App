export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AssetType = "endpoint"|"auth"|"service"|"database"|"pipeline"|"secret"|"dependency"|"storage";
export type Asset = { id:string; type:AssetType; name:string; exposure:number; sensitivity:number; filePath?:string; metadata?:Record<string,string|number|boolean> };
export type AssetRelation = { id:string; sourceId:string; targetId:string; type:"calls"|"reads"|"writes"|"authenticates"|"depends_on"|"deploys"|"contains"|"exposes"; confidence:number; evidence?:string };
export type Finding = { id:string; scanner:string; category:string; severity:Severity; confidence:number; title:string; description:string; filePath:string; startLine:number; cwe?:string; assetId:string; exploitability:number; riskScore:number };
export type AttackPathStep = { assetId:string; findingId?:string; reason:string };
export type AttackPath = { id:string; title:string; assetIds:string[]; steps:AttackPathStep[]; likelihood:number; impact:number; score:number };
export type ScanResult = { id:string; repositoryUrl:string; createdAt:string; assets:Asset[]; relations:AssetRelation[]; findings:Finding[]; attackPaths:AttackPath[] };
export type ScanScore = { overall:number; critical:number; high:number; weightedRisk:number };

const severityWeight:Record<Severity,number>={critical:10,high:7,medium:4,low:2,info:.5};
export function calculateFindingRisk(finding:Omit<Finding,"riskScore">, asset:Asset):number {
  const raw=severityWeight[finding.severity]*finding.confidence*(.55+finding.exploitability*.45)*(1+asset.exposure*.65+asset.sensitivity*.55);
  return Math.min(100,Math.round(raw*4));
}
export function scoreScan(findings:Finding[], assets:Asset[]):ScanScore {
  const weightedRisk=findings.reduce((sum,f)=>sum+f.riskScore,0);
  const exposure=assets.reduce((s,a)=>s+a.exposure*a.sensitivity,0);
  const overall=Math.max(0,Math.round(100-Math.min(96,weightedRisk*.34+exposure*2.2)));
  return {overall,critical:findings.filter(f=>f.severity==="critical").length,high:findings.filter(f=>f.severity==="high").length,weightedRisk};
}
export function deriveAttackPaths(assets:Asset[], relations:AssetRelation[], findings:Finding[]):AttackPath[] {
  const bySource=new Map<string,AssetRelation[]>();
  for(const relation of relations) bySource.set(relation.sourceId,[...(bySource.get(relation.sourceId)??[]),relation]);
  const findingsByAsset=new Map<string,Finding[]>();
  for(const finding of findings) findingsByAsset.set(finding.assetId,[...(findingsByAsset.get(finding.assetId)??[]),finding]);
  const starts=assets.filter(a=>a.exposure>=.7||a.type==="endpoint"||a.type==="pipeline");
  const targets=new Set(assets.filter(a=>a.sensitivity>=.85||a.type==="database"||a.type==="secret").map(a=>a.id));
  const paths:AttackPath[]=[];
  for(const start of starts){
    const queue:[string,string[]][]=[[start.id,[start.id]]];
    while(queue.length){
      const [current,path]=queue.shift()!;
      if(path.length>5) continue;
      if(path.length>1&&targets.has(current)){
        const involved=path.flatMap(id=>findingsByAsset.get(id)??[]).sort((a,b)=>b.riskScore-a.riskScore);
        if(!involved.length) continue;
        const likelihood=Math.min(.99,involved.reduce((s,f)=>s+f.exploitability*f.confidence,0)/involved.length);
        const impact=Math.min(.99,path.map(id=>assets.find(a=>a.id===id)?.sensitivity??.4).reduce((a,b)=>a+b,0)/path.length);
        paths.push({id:`path:${path.join(">")}`,title:`${start.name} → ${assets.find(a=>a.id===current)?.name??current}`,assetIds:path,steps:path.map((id,index)=>({assetId:id,findingId:(findingsByAsset.get(id)??[])[0]?.id,reason:index===0?"Externally reachable entry point":index===path.length-1?"Sensitive target reached":"Trust or data-flow relationship"})),likelihood,impact,score:Math.round(likelihood*impact*100)});
        continue;
      }
      for(const edge of bySource.get(current)??[]) if(!path.includes(edge.targetId)) queue.push([edge.targetId,[...path,edge.targetId]]);
    }
  }
  return [...new Map(paths.map(p=>[p.id,p])).values()].sort((a,b)=>b.score-a.score).slice(0,12);
}
