import {createHash} from "node:crypto";
import {defaultCloudControls} from "./controls.js";
import type {CloudControl,CloudPostureFinding,CloudPostureReport,CloudResource} from "./types.js";
export type {CloudControl,CloudFindingSeverity,CloudPostureFinding,CloudPostureReport,CloudProvider,CloudResource,CloudResourceType} from "./types.js";
export {defaultCloudControls};
const weight={critical:30,high:18,medium:8,low:3} as const;
export function evaluateCloudPosture(resources:CloudResource[],controls:CloudControl[]=defaultCloudControls):CloudPostureReport{
 const findings:CloudPostureFinding[]=[];let passedControls=0,failedControls=0;
 for(const resource of resources){for(const control of controls.filter(c=>c.resourceTypes.includes(resource.type))){if(control.evaluate(resource)){passedControls++;continue;}failedControls++;const fp=createHash("sha256").update(`${resource.tenantId}|${resource.id}|${control.id}`).digest("hex");findings.push({id:`cloud_${fp.slice(0,16)}`,controlId:control.id,resourceId:resource.id,severity:control.severity,title:control.title,remediation:control.remediation});}}
 const penalty=findings.reduce((s,f)=>s+weight[f.severity],0);
 return {score:Math.max(0,Math.min(100,100-penalty)),checkedResources:resources.length,passedControls,failedControls,findings};
}
export function shouldBlockCloudDeployment(report:CloudPostureReport,minimumScore=70):boolean{return report.score<minimumScore||report.findings.some(f=>f.severity==="critical");}
export function createCloudPostureSummary(report:CloudPostureReport):string{return [`Cloud posture score: ${report.score}/100`,`Resources checked: ${report.checkedResources}`,`Controls passed: ${report.passedControls}`,`Controls failed: ${report.failedControls}`,`Critical findings: ${report.findings.filter(f=>f.severity==="critical").length}`].join("\n");}
