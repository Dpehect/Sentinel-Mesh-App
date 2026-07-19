import type {Finding,Asset,Relation} from "@sentinel/security-core";
export interface ScanContext { repositoryPath:string; repositoryUrl:string; changedFiles?:string[]; signal?:AbortSignal; log:(line:string)=>void }
export interface ScannerPlugin { id:string; name:string; version:string; availability():Promise<{available:boolean;reason?:string}>; scan(context:ScanContext):Promise<Finding[]> }
export interface AssetPlugin { id:string; discover(context:ScanContext):Promise<{assets:Asset[];relations:Relation[]}> }
export function defineScanner<T extends ScannerPlugin>(plugin:T){return plugin}
