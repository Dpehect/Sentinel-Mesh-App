export type Severity = "critical"|"high"|"medium"|"low"|"info";
export type AssetType = "repository"|"endpoint"|"service"|"database"|"secret"|"dependency"|"container"|"workflow"|"role"|"file";
export type Exposure = "public"|"internal"|"private";
export type Privilege = "anonymous"|"user"|"service"|"admin"|"system";
export type TrustZone = "internet"|"edge"|"application"|"data"|"ci"|"secrets"|"unknown";
export interface Evidence { file?: string; line?: number; excerpt?: string; source: string }
export interface Finding { id:string; ruleId:string; title:string; description:string; severity:Severity; confidence:number; category:string; scanner:string; cwe?:string; owasp?:string; assetId?:string; evidence:Evidence[]; remediation?:string; fingerprint:string; exploitability?:number; requiresPrivilege?:Privilege }
export interface Asset { id:string; type:AssetType; name:string; path?:string; exposure:Exposure; criticality:number; trustZone?:TrustZone; minimumPrivilege?:Privilege; dataSensitivity?:number; metadata:Record<string,unknown> }
export type RelationKind="calls"|"reads"|"writes"|"depends_on"|"contains"|"exposes"|"authenticates"|"authorizes"|"deploys"|"executes";
export interface Relation { id:string; from:string; to:string; kind:RelationKind; evidence?:string; crossesTrustBoundary?:boolean; requiredPrivilege?:Privilege; networkReachable?:boolean; findingIds?:string[]; confidence?:number }
export interface AttackPathStep { assetId:string; relationId?:string; reason:string; findingIds:string[]; requiredPrivilege:Privilege; trustZone:TrustZone; transitionRisk:number }
export interface RiskBreakdown { severity:number; exploitability:number; exposure:number; privilege:number; confidence:number; assetImpact:number; pathReachability:number; total:number; explanation:string[] }
export interface AttackPath { id:string; title:string; steps:AttackPathStep[]; likelihood:number; impact:number; score:number; controls:string[]; initialPrivilege:Privilege; targetPrivilege:Privilege; trustBoundaries:number; findingIds:string[]; breakdown:RiskBreakdown }
export interface ScanResult { repository:string; startedAt:string; completedAt:string; findings:Finding[]; assets:Asset[]; relations:Relation[]; attackPaths:AttackPath[]; score:number }
