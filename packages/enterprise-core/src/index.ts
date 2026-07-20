import {createHash,randomBytes} from "node:crypto";
export type EnterpriseRole="owner"|"admin"|"security_engineer"|"developer"|"auditor"|"viewer";
export type PolicyEffect="allow"|"deny";
export type PolicyRule={id:string;effect:PolicyEffect;action:string;resource:string;conditions?:Record<string,string|number|boolean>};
export type ComplianceControl={framework:"OWASP"|"NIST"|"CIS"|"SOC2";control:string;title:string;status:"passing"|"failing"|"unknown";evidence:string[]};
const roleRank:Record<EnterpriseRole,number>={viewer:1,auditor:2,developer:3,security_engineer:4,admin:5,owner:6};
export function canManageRole(actor:EnterpriseRole,target:EnterpriseRole){return roleRank[actor]>roleRank[target]||actor==="owner"}
export function evaluatePolicy(rules:PolicyRule[],input:{action:string;resource:string;context?:Record<string,unknown>}){const matches=rules.filter(r=>(r.action==="*"||r.action===input.action)&&(r.resource==="*"||r.resource===input.resource));if(matches.some(r=>r.effect==="deny"))return {allowed:false,reason:"Explicit deny policy"};if(matches.some(r=>r.effect==="allow"))return {allowed:true,reason:"Allow policy matched"};return {allowed:false,reason:"No allow policy matched"}}
export function issueApiToken(prefix="sm_live"){const secret=randomBytes(24).toString("base64url");return {token:`${prefix}_${secret}`,hash:createHash("sha256").update(secret).digest("hex"),lastFour:secret.slice(-4)}}
export function hashApiToken(token:string){const secret=token.split("_").slice(2).join("_");return createHash("sha256").update(secret).digest("hex")}
export function complianceSummary(controls:ComplianceControl[]){const passing=controls.filter(x=>x.status==="passing").length;const failing=controls.filter(x=>x.status==="failing").length;return {total:controls.length,passing,failing,coverage:controls.length?Math.round(passing/controls.length*100):0}}
