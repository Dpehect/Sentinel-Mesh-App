import {createHash} from "node:crypto";
import {evaluateRules, postureRules} from "./rules.js";
import type {AssetKind, PostureAsset, PostureScanInput, PostureScanResult, Severity} from "./types.js";

export * from "./types.js";
export * from "./rules.js";

const classify = (path: string, content: string): {kind: AssetKind; provider: PostureAsset["provider"]} => {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tf")) return {kind:"terraform-resource", provider:/azurerm_/.test(content)?"azure":/google_/.test(content)?"gcp":"aws"};
  if (/awstemplateformatversion|aws::/i.test(content)) return {kind:"cloudformation-resource",provider:"aws"};
  if (/kind:\s*(Deployment|StatefulSet|DaemonSet|Pod)/i.test(content)) return {kind:"kubernetes-workload",provider:"kubernetes"};
  if (/kind:\s*(Service|Ingress|NetworkPolicy)/i.test(content)) return {kind:"kubernetes-service",provider:"kubernetes"};
  if (/kind:\s*(Role|ClusterRole|RoleBinding|ClusterRoleBinding|ServiceAccount)/i.test(content)) return {kind:"kubernetes-rbac",provider:"kubernetes"};
  return {kind:"docker-service",provider:"docker"};
};

const scoreWeights: Record<Severity, number> = {critical:25,high:15,medium:8,low:3,info:1};

export function scanPosture(inputs: PostureScanInput[]): PostureScanResult {
  const assets: PostureAsset[] = [];
  const findings = inputs.flatMap(input => {
    const id = createHash("sha256").update(input.path).digest("hex").slice(0,16);
    const classification = classify(input.path,input.content);
    assets.push({
      id,
      ...classification,
      name: input.path.split("/").pop() ?? input.path,
      source: input.path,
      metadata: {bytes: Buffer.byteLength(input.content), ruleCount: postureRules.length}
    });
    return evaluateRules(input.path,input.content,id);
  });
  const summary: Record<Severity, number> = {critical:0,high:0,medium:0,low:0,info:0};
  for (const finding of findings) summary[finding.severity]++;
  const penalty = findings.reduce((sum,f) => sum + scoreWeights[f.severity],0);
  return {assets,findings,score:Math.max(0,100-penalty),summary};
}
export * from "./graph.js";
