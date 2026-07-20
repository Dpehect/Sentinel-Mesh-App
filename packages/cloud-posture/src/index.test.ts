import {describe,expect,it} from "vitest";
import {createCloudPostureSummary,evaluateCloudPosture,shouldBlockCloudDeployment} from "./index.js";
describe("cloud posture",()=>{
 it("detects public unencrypted storage",()=>{const r=evaluateCloudPosture([{id:"bucket-1",tenantId:"org-1",provider:"aws",type:"storage",name:"exports",configuration:{publicAccess:true,encryptionAtRest:false,criticalData:true,backupEnabled:false}}]);expect(r.findings.some(x=>x.controlId==="CSPM-STORAGE-001")).toBe(true);expect(shouldBlockCloudDeployment(r)).toBe(true);});
 it("allows compliant database",()=>{const r=evaluateCloudPosture([{id:"db-1",tenantId:"org-1",provider:"gcp",type:"database",name:"prod",configuration:{encryptionAtRest:true,auditLogging:true,criticalData:true,backupEnabled:true}}]);expect(r.findings).toHaveLength(0);expect(r.score).toBe(100);});
 it("renders summary",()=>expect(createCloudPostureSummary(evaluateCloudPosture([]))).toContain("Cloud posture score:"));
});
