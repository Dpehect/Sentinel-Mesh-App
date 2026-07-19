export type Severity = "critical"|"high"|"medium"|"low"|"info";
export type AssetType = "repository"|"endpoint"|"service"|"database"|"secret"|"dependency"|"container"|"workflow"|"role"|"file";
export interface Evidence { file?: string; line?: number; excerpt?: string; source: string }
export interface Finding { id:string; ruleId:string; title:string; description:string; severity:Severity; confidence:number; category:string; scanner:string; cwe?:string; owasp?:string; assetId?:string; evidence:Evidence[]; remediation?:string; fingerprint:string }
export interface Asset { id:string; type:AssetType; name:string; path?:string; exposure:"public"|"internal"|"private"; criticality:number; metadata:Record<string,unknown> }
export interface Relation { id:string; from:string; to:string; kind:"calls"|"reads"|"writes"|"depends_on"|"contains"|"exposes"|"authenticates"|"deploys"; evidence?:string }
export interface AttackPathStep { assetId:string; reason:string; findingIds:string[] }
export interface AttackPath { id:string; title:string; steps:AttackPathStep[]; likelihood:number; impact:number; score:number; controls:string[] }
export interface ScanResult { repository:string; startedAt:string; completedAt:string; findings:Finding[]; assets:Asset[]; relations:Relation[]; attackPaths:AttackPath[]; score:number }
