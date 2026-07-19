export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type Asset = { id:string; type:"endpoint"|"auth"|"service"|"database"|"pipeline"; name:string; exposure:number; sensitivity:number };
export type Finding = { id:string; scanner:string; category:string; severity:Severity; confidence:number; title:string; description:string; filePath:string; startLine:number; cwe?:string; assetId:string; exploitability:number; riskScore:number };
export type AttackPath = { id:string; title:string; assetIds:string[]; likelihood:number; impact:number };
export type ScanResult = { id:string; repositoryUrl:string; createdAt:string; assets:Asset[]; findings:Finding[]; attackPaths:AttackPath[] };
export type ScanScore = { overall:number; critical:number; high:number; weightedRisk:number };

const severityWeight:Record<Severity,number>={critical:10,high:7,medium:4,low:2,info:.5};
export function calculateFindingRisk(finding:Omit<Finding,"riskScore">, asset:Asset):number {
  const raw=severityWeight[finding.severity]*finding.confidence*(.55+finding.exploitability*.45)*(1+asset.exposure*.65+asset.sensitivity*.55);
  return Math.min(100,Math.round(raw*4));
}
export function scoreScan(findings:Finding[], assets:Asset[]):ScanScore {
  const weightedRisk=findings.reduce((sum,f)=>sum+f.riskScore,0);
  const exposure=assets.reduce((s,a)=>s+a.exposure*a.sensitivity,0);
  const overall=Math.max(0,Math.round(100-Math.min(96,weightedRisk*.34+exposure*3)));
  return {overall,critical:findings.filter(f=>f.severity==="critical").length,high:findings.filter(f=>f.severity==="high").length,weightedRisk};
}
export function demoScan(repositoryUrl:string):ScanResult {
  const assets:Asset[]=[
    {id:"api-upload",type:"endpoint",name:"POST /api/upload",exposure:1,sensitivity:.7},
    {id:"auth",type:"auth",name:"Session middleware",exposure:.8,sensitivity:.9},
    {id:"admin",type:"service",name:"Admin actions",exposure:.5,sensitivity:1},
    {id:"db",type:"database",name:"Application database",exposure:.25,sensitivity:1},
    {id:"ci",type:"pipeline",name:"GitHub Actions",exposure:.55,sensitivity:.8},
  ];
  const base:Omit<Finding,"riskScore">[]=[
    {id:"f-1",scanner:"Sentinel AST",category:"Broken access control",severity:"critical",confidence:.93,title:"Admin action lacks explicit ownership check",description:"A privileged mutation trusts a client supplied resource identifier.",filePath:"src/app/actions/admin.ts",startLine:48,cwe:"CWE-862",assetId:"admin",exploitability:.86},
    {id:"f-2",scanner:"Gitleaks adapter",category:"Secret exposure",severity:"high",confidence:.88,title:"Credential-like token in workflow history",description:"A high entropy token is present in a CI configuration sample.",filePath:".github/workflows/release.yml",startLine:27,cwe:"CWE-798",assetId:"ci",exploitability:.7},
    {id:"f-3",scanner:"Semgrep adapter",category:"Unsafe file handling",severity:"high",confidence:.81,title:"Uploaded filename reaches filesystem path",description:"Normalize and replace user controlled file names before persistence.",filePath:"src/app/api/upload/route.ts",startLine:61,cwe:"CWE-22",assetId:"api-upload",exploitability:.77},
    {id:"f-4",scanner:"Policy engine",category:"Session security",severity:"medium",confidence:.74,title:"Session rotation policy not detected",description:"Rotate sensitive sessions after privilege changes.",filePath:"src/lib/auth.ts",startLine:34,cwe:"CWE-384",assetId:"auth",exploitability:.46},
  ];
  const findings=base.map(f=>({...f,riskScore:calculateFindingRisk(f,assets.find(a=>a.id===f.assetId)!)}));
  return {id:crypto.randomUUID(),repositoryUrl,createdAt:new Date().toISOString(),assets,findings,attackPaths:[{id:"p-1",title:"Public upload to sensitive database",assetIds:["api-upload","auth","admin","db"],likelihood:.72,impact:.94}]};
}
