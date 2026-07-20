export type CloudProvider = "aws" | "azure" | "gcp" | "generic";
export type CloudResourceType = "storage" | "database" | "compute" | "identity" | "network" | "secret-store" | "logging";
export type CloudFindingSeverity = "critical" | "high" | "medium" | "low";
export interface CloudResource { id:string; tenantId:string; provider:CloudProvider; type:CloudResourceType; name:string; region?:string; configuration:Record<string, unknown>; }
export interface CloudControl { id:string; title:string; resourceTypes:CloudResourceType[]; severity:CloudFindingSeverity; evaluate:(resource:CloudResource)=>boolean; remediation:string; }
export interface CloudPostureFinding { id:string; controlId:string; resourceId:string; severity:CloudFindingSeverity; title:string; remediation:string; }
export interface CloudPostureReport { score:number; checkedResources:number; passedControls:number; failedControls:number; findings:CloudPostureFinding[]; }
