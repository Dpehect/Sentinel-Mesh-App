import type {Finding, ScanResult, Severity} from "@sentinel/security-core";

export type FindingCluster={id:string;label:string;findingIds:string[];representativeId:string;similarity:number;rootCause:string};
export type FindingIntelligence={findingId:string;falsePositiveProbability:number;priorityScore:number;duplicateOf?:string;signals:string[]};
export type TrendPoint={label:string;score:number;critical:number;high:number;total:number};
export type IntelligenceReport={clusters:FindingCluster[];findings:FindingIntelligence[];trends:TrendPoint[];summary:{duplicateReduction:number;reviewQueue:number;likelyFalsePositives:number;topRootCause:string}};

const severityWeight:Record<Severity,number>={critical:100,high:76,medium:48,low:22,info:8};
const stop=new Set(["the","and","with","from","this","that","into","possible","detected","security","finding","source"]);
function tokens(text:string){return [...new Set(text.toLowerCase().replace(/[^a-z0-9_-]+/g," ").split(/\s+/).filter(x=>x.length>2&&!stop.has(x)))];}
function vector(text:string,size=96){const out=new Float64Array(size);for(const token of tokens(text)){let h=2166136261;for(let i=0;i<token.length;i++){h^=token.charCodeAt(i);h=Math.imul(h,16777619)}out[Math.abs(h)%size]+=1;}const n=Math.sqrt(out.reduce((s,v)=>s+v*v,0))||1;return Array.from(out,v=>v/n)}
function cosine(a:number[],b:number[]){let n=0;for(let i=0;i<a.length;i++)n+=a[i]*b[i];return n;}
function text(f:Finding){return [f.title,f.description,f.category,f.ruleId,f.cwe,f.owasp,f.remediation,f.evidence.map(e=>`${e.file??""} ${e.excerpt??""}`).join(" ")].filter(Boolean).join(" ")}
function rootCause(f:Finding){if(f.category==="secret")return "Credential lifecycle and secret management";if(f.category.includes("injection"))return "Untrusted input reaches an unsafe execution sink";if(f.category==="auth")return "Authentication or authorization boundary weakness";if(f.category==="dependency")return "Outdated or vulnerable software supply chain";if(f.cwe==="CWE-918")return "Unrestricted outbound request construction";return `${f.category.replace(/[_-]/g," ")} control weakness`;}

export function clusterFindings(findings:Finding[],threshold=.68):FindingCluster[]{
 const vectors=findings.map(f=>vector(text(f)));const assigned=new Set<number>();const clusters:FindingCluster[]=[];
 for(let i=0;i<findings.length;i++){if(assigned.has(i))continue;const members=[i];assigned.add(i);let sum=0,count=0;for(let j=i+1;j<findings.length;j++){if(assigned.has(j))continue;const structural=findings[i].category===findings[j].category||findings[i].ruleId===findings[j].ruleId;const sim=cosine(vectors[i],vectors[j])+(structural ? .16 : 0);if(sim>=threshold){members.push(j);assigned.add(j);sum+=Math.min(1,sim);count++;}}
 const representative=findings[members.sort((a,b)=>severityWeight[findings[b].severity]-severityWeight[findings[a].severity])[0]];clusters.push({id:`cluster-${clusters.length+1}`,label:members.length>1?`${representative.category.replace(/[_-]/g," ")} family`:representative.title,findingIds:members.map(x=>findings[x].id),representativeId:representative.id,similarity:count?Number((sum/count).toFixed(2)):1,rootCause:rootCause(representative)});
 }
 return clusters.sort((a,b)=>b.findingIds.length-a.findingIds.length);
}

export function scoreFinding(f:Finding,clusterSize=1):FindingIntelligence{
 const signals:string[]=[];let fp=.18;const evidence=f.evidence[0];if(!evidence?.line){fp+=.22;signals.push("No precise source line")}if(!evidence?.excerpt){fp+=.18;signals.push("No source excerpt")}if(f.confidence<.7){fp+=.2;signals.push("Low scanner confidence")}if(f.scanner==="builtin"){fp+=.08;signals.push("Heuristic scanner result")}if(f.cwe){fp-=.08;signals.push("Mapped to CWE")}if(clusterSize>1){fp-=.05;signals.push(`Corroborated by ${clusterSize} related findings`)}fp=Math.max(.02,Math.min(.92,fp));
 const priority=Math.round(Math.min(100,severityWeight[f.severity]*(.62+.38*f.confidence)*(1-fp*.42)+(f.exploitability??50)*.16));
 return {findingId:f.id,falsePositiveProbability:Number(fp.toFixed(2)),priorityScore:priority,signals};
}

export function buildTrend(scans:ScanResult[]):TrendPoint[]{return scans.slice(-12).map((s,i)=>({label:`Scan ${i+1}`,score:s.score,critical:s.findings.filter(f=>f.severity==="critical").length,high:s.findings.filter(f=>f.severity==="high").length,total:s.findings.length}))}

export function analyzeSecurityIntelligence(current:ScanResult,history:ScanResult[]=[]):IntelligenceReport{
 const clusters=clusterFindings(current.findings);const size=new Map(clusters.flatMap(c=>c.findingIds.map(id=>[id,c.findingIds.length] as const)));const findings=current.findings.map(f=>scoreFinding(f,size.get(f.id)??1)).sort((a,b)=>b.priorityScore-a.priorityScore);
 const duplicates=clusters.reduce((s,c)=>s+Math.max(0,c.findingIds.length-1),0);const likely=findings.filter(f=>f.falsePositiveProbability>=.55).length;const root=clusters[0]?.rootCause??"No dominant root cause";
 return {clusters,findings,trends:buildTrend(history.length?history:[current]),summary:{duplicateReduction:duplicates,reviewQueue:findings.filter(f=>f.priorityScore>=55).length,likelyFalsePositives:likely,topRootCause:root}};
}
