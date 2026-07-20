export type PostureSeverity = "critical" | "high" | "medium" | "low";
export type PostureProvider = "kubernetes" | "terraform" | "cloudformation" | "docker-compose";

export interface PostureAsset {
  id: string;
  provider: PostureProvider;
  kind: string;
  name: string;
  namespace?: string;
  source: string;
  internetExposed: boolean;
  privileged: boolean;
  metadata: Record<string, string | number | boolean>;
}

export interface PostureFinding {
  id: string;
  ruleId: string;
  title: string;
  severity: PostureSeverity;
  provider: PostureProvider;
  assetId: string;
  source: string;
  evidence: string;
  remediation: string;
  confidence: number;
  riskScore: number;
  frameworks: string[];
}

export interface PostureAttackPath {
  id: string;
  title: string;
  score: number;
  nodes: string[];
  explanation: string;
}

export interface PostureReport {
  generatedAt: string;
  score: number;
  kubernetesScore: number;
  cloudScore: number;
  assets: PostureAsset[];
  findings: PostureFinding[];
  attackPaths: PostureAttackPath[];
  summary: Record<PostureSeverity, number>;
}

type Rule = {
  id: string;
  title: string;
  severity: PostureSeverity;
  provider: PostureProvider;
  match: (text: string) => boolean;
  evidence: (text: string) => string;
  remediation: string;
  frameworks: string[];
};

const includes = (value: string) => (text: string) => text.toLowerCase().includes(value.toLowerCase());
const excludes = (value: string) => (text: string) => !includes(value)(text);
const all = (...checks: Array<(text: string) => boolean>) => (text: string) => checks.every((check) => check(text));

export const postureRules: Rule[] = [
  {id:"K8S-001",title:"Privileged container",severity:"critical",provider:"kubernetes",match:includes("privileged: true"),evidence:()=>"securityContext.privileged is enabled",remediation:"Set privileged to false and grant only required capabilities.",frameworks:["CIS Kubernetes 5.2.1","NSA Kubernetes Hardening"]},
  {id:"K8S-002",title:"Privilege escalation allowed",severity:"high",provider:"kubernetes",match:includes("allowPrivilegeEscalation: true"),evidence:()=>"allowPrivilegeEscalation is enabled",remediation:"Set allowPrivilegeEscalation to false.",frameworks:["CIS Kubernetes 5.2.5"]},
  {id:"K8S-003",title:"Container may run as root",severity:"high",provider:"kubernetes",match:all(excludes("runAsNonRoot: true"),excludes("runAsUser:")),evidence:()=>"No non-root execution control detected",remediation:"Set runAsNonRoot: true and a non-zero runAsUser.",frameworks:["CIS Kubernetes 5.2.6"]},
  {id:"K8S-004",title:"Host network enabled",severity:"critical",provider:"kubernetes",match:includes("hostNetwork: true"),evidence:()=>"Pod shares the host network namespace",remediation:"Disable hostNetwork unless operationally required.",frameworks:["CIS Kubernetes 5.2.4"]},
  {id:"K8S-005",title:"Host PID enabled",severity:"critical",provider:"kubernetes",match:includes("hostPID: true"),evidence:()=>"Pod shares host process namespace",remediation:"Disable hostPID.",frameworks:["CIS Kubernetes 5.2.2"]},
  {id:"K8S-006",title:"HostPath volume mounted",severity:"high",provider:"kubernetes",match:includes("hostPath:"),evidence:()=>"Host filesystem path is mounted",remediation:"Replace hostPath with a constrained persistent volume.",frameworks:["CIS Kubernetes 5.2.8"]},
  {id:"K8S-007",title:"Writable root filesystem",severity:"medium",provider:"kubernetes",match:all(includes("kind:"),excludes("readOnlyRootFilesystem: true")),evidence:()=>"No read-only root filesystem control detected",remediation:"Set readOnlyRootFilesystem: true.",frameworks:["NSA Kubernetes Hardening"]},
  {id:"K8S-008",title:"Image uses latest tag",severity:"medium",provider:"kubernetes",match:(t)=>/image:\s*[^\s]+(:latest)?\s*$/mi.test(t) && !/image:\s*[^\s]+:[\w.-]+/mi.test(t.replace(/:latest/g,"")),evidence:()=>"Container image is unpinned or uses latest",remediation:"Pin images to an immutable digest or explicit version.",frameworks:["CIS Kubernetes 5.5.1"]},
  {id:"K8S-009",title:"Resource limits missing",severity:"medium",provider:"kubernetes",match:all(includes("containers:"),excludes("limits:")),evidence:()=>"No container resource limits detected",remediation:"Define CPU and memory requests and limits.",frameworks:["CIS Kubernetes 5.4"]},
  {id:"K8S-010",title:"Wildcard Kubernetes RBAC",severity:"critical",provider:"kubernetes",match:(t)=>/verbs:\s*\[[^\]]*["']?\*["']?/i.test(t)||/resources:\s*\[[^\]]*["']?\*["']?/i.test(t),evidence:()=>"RBAC rule includes wildcard permissions",remediation:"Replace wildcard verbs/resources with least-privilege permissions.",frameworks:["CIS Kubernetes 5.1.3"]},
  {id:"K8S-011",title:"Public LoadBalancer service",severity:"high",provider:"kubernetes",match:includes("type: LoadBalancer"),evidence:()=>"Service may create an internet-facing load balancer",remediation:"Use ClusterIP or explicitly constrain source ranges.",frameworks:["CIS Kubernetes 5.3"]},
  {id:"K8S-012",title:"Default service account usage",severity:"medium",provider:"kubernetes",match:all(includes("kind:"),excludes("serviceAccountName:")),evidence:()=>"Workload does not specify a dedicated service account",remediation:"Create and assign a least-privilege service account.",frameworks:["CIS Kubernetes 5.1.5"]},
  {id:"TF-001",title:"Security group open to the internet",severity:"critical",provider:"terraform",match:(t)=>/cidr_blocks\s*=\s*\[[^\]]*0\.0\.0\.0\/0/i.test(t),evidence:()=>"Ingress allows 0.0.0.0/0",remediation:"Restrict CIDR ranges and expose only required ports.",frameworks:["CIS AWS 5.2","NIST AC-4"]},
  {id:"TF-002",title:"Public S3 bucket configuration",severity:"critical",provider:"terraform",match:(t)=>/acl\s*=\s*["']public-(read|read-write)["']/i.test(t)||/block_public_acls\s*=\s*false/i.test(t),evidence:()=>"Storage public-access protections are disabled",remediation:"Enable all public access blocks and use private ACLs.",frameworks:["CIS AWS 2.1.5","NIST AC-3"]},
  {id:"TF-003",title:"Unencrypted storage",severity:"high",provider:"terraform",match:(t)=>/(aws_ebs_volume|aws_db_instance|azurerm_storage_account|google_compute_disk)/i.test(t)&&!/encrypted\s*=\s*true|storage_encrypted\s*=\s*true|enable_https_traffic_only\s*=\s*true|disk_encryption_key/i.test(t),evidence:()=>"Encryption-at-rest control was not detected",remediation:"Enable provider-native encryption with managed or customer keys.",frameworks:["CIS","NIST SC-28"]},
  {id:"TF-004",title:"IAM wildcard permission",severity:"critical",provider:"terraform",match:(t)=>/actions?\s*=\s*\[[^\]]*["']\*["']/i.test(t)||/resources?\s*=\s*\[[^\]]*["']\*["']/i.test(t),evidence:()=>"IAM statement grants wildcard access",remediation:"Restrict actions and resources to the minimum required set.",frameworks:["CIS AWS 1.16","NIST AC-6"]},
  {id:"TF-005",title:"Public database exposure",severity:"critical",provider:"terraform",match:(t)=>/publicly_accessible\s*=\s*true/i.test(t),evidence:()=>"Database is configured as publicly accessible",remediation:"Disable public access and place the database in private subnets.",frameworks:["CIS AWS 2.3","NIST SC-7"]},
  {id:"TF-006",title:"Audit logging disabled",severity:"high",provider:"terraform",match:(t)=>/(cloudtrail|diagnostic_setting|audit_config)/i.test(t)&&/enable_logging\s*=\s*false|logging_enabled\s*=\s*false/i.test(t),evidence:()=>"Cloud audit logging is disabled",remediation:"Enable immutable organization-wide audit logging.",frameworks:["CIS","SOC2 CC7.2"]},
  {id:"CFN-001",title:"CloudFormation security group open to world",severity:"critical",provider:"cloudformation",match:(t)=>/CidrIp:\s*0\.0\.0\.0\/0/i.test(t),evidence:()=>"Security group ingress allows 0.0.0.0/0",remediation:"Restrict source ranges and ports.",frameworks:["CIS AWS 5.2"]},
  {id:"CFN-002",title:"CloudFormation public S3 access",severity:"critical",provider:"cloudformation",match:(t)=>/AccessControl:\s*Public(Read|ReadWrite)/i.test(t),evidence:()=>"S3 bucket access control is public",remediation:"Use Private access control and enable PublicAccessBlockConfiguration.",frameworks:["CIS AWS 2.1.5"]},
  {id:"CMP-001",title:"Container runs as privileged",severity:"critical",provider:"docker-compose",match:includes("privileged: true"),evidence:()=>"Compose service runs privileged",remediation:"Remove privileged mode and grant narrowly scoped capabilities.",frameworks:["CIS Docker 5.4"]},
  {id:"CMP-002",title:"Host network mode",severity:"high",provider:"docker-compose",match:includes("network_mode: host"),evidence:()=>"Compose service uses host network",remediation:"Use an isolated bridge network.",frameworks:["CIS Docker 5.9"]},
  {id:"CMP-003",title:"Docker socket mounted",severity:"critical",provider:"docker-compose",match:includes("/var/run/docker.sock"),evidence:()=>"Docker socket is mounted into a container",remediation:"Remove the Docker socket mount or use a constrained proxy.",frameworks:["CIS Docker 5.31"]}
];

const severityWeight: Record<PostureSeverity, number> = {critical: 30, high: 18, medium: 8, low: 3};
const providerFor = (path: string, text: string): PostureProvider => {
  if (path.endsWith(".tf")) return "terraform";
  if (/AWSTemplateFormatVersion|AWS::/i.test(text)) return "cloudformation";
  if (/services:\s*\n/i.test(text) && /image:/i.test(text)) return "docker-compose";
  return "kubernetes";
};
const assetKind = (text: string, provider: PostureProvider) => provider === "terraform" ? (text.match(/resource\s+"([^"]+)"/)?.[1] ?? "terraform-resource") : (text.match(/kind:\s*([^\s]+)/i)?.[1] ?? provider);
const assetName = (text: string, path: string) => text.match(/name:\s*([^\s]+)/i)?.[1] ?? path.split(/[\\/]/).pop() ?? "unknown";

export function analyzePostureFile(path: string, text: string): PostureReport {
  const provider = providerFor(path, text);
  const asset: PostureAsset = {
    id: `asset:${provider}:${assetName(text,path)}`,
    provider,
    kind: assetKind(text, provider),
    name: assetName(text, path),
    namespace: text.match(/namespace:\s*([^\s]+)/i)?.[1],
    source: path,
    internetExposed: /0\.0\.0\.0\/0|type:\s*LoadBalancer|publicly_accessible\s*=\s*true/i.test(text),
    privileged: /privileged:\s*true|hostNetwork:\s*true|hostPID:\s*true/i.test(text),
    metadata: {}
  };
  const findings = postureRules.filter((r)=>r.provider===provider && r.match(text)).map((rule, index): PostureFinding => ({
    id:`${rule.id}:${index}:${asset.name}`,
    ruleId:rule.id,
    title:rule.title,
    severity:rule.severity,
    provider,
    assetId:asset.id,
    source:path,
    evidence:rule.evidence(text),
    remediation:rule.remediation,
    confidence:0.9,
    riskScore:Math.min(100,severityWeight[rule.severity]+(asset.internetExposed?25:0)+(asset.privileged?20:0)),
    frameworks:rule.frameworks
  }));
  return aggregatePostureReports([{generatedAt:new Date().toISOString(),score:100,kubernetesScore:100,cloudScore:100,assets:[asset],findings,attackPaths:[],summary:{critical:0,high:0,medium:0,low:0}}]);
}

export function aggregatePostureReports(reports: PostureReport[]): PostureReport {
  const assets=reports.flatMap((r)=>r.assets); const findings=reports.flatMap((r)=>r.findings);
  const summary={critical:0,high:0,medium:0,low:0} as Record<PostureSeverity,number>;
  findings.forEach((f)=>summary[f.severity]++);
  const penalty=findings.reduce((sum,f)=>sum+severityWeight[f.severity],0);
  const k8s=findings.filter((f)=>f.provider==="kubernetes"); const cloud=findings.filter((f)=>f.provider!=="kubernetes");
  const attackPaths: PostureAttackPath[]=[];
  for(const asset of assets.filter((a)=>a.internetExposed)){
    const related=findings.filter((f)=>f.assetId===asset.id);
    if(related.some((f)=>f.severity==="critical"||f.severity==="high")) attackPaths.push({id:`path:${asset.id}`,title:`Internet exposure to ${asset.name}`,score:Math.max(...related.map((f)=>f.riskScore),50),nodes:["Internet",asset.kind,asset.name,...related.slice(0,2).map((f)=>f.title)],explanation:"An internet-exposed asset is correlated with high-impact posture weaknesses."});
  }
  return {generatedAt:new Date().toISOString(),score:Math.max(0,100-Math.min(100,penalty)),kubernetesScore:Math.max(0,100-Math.min(100,k8s.reduce((s,f)=>s+severityWeight[f.severity],0))),cloudScore:Math.max(0,100-Math.min(100,cloud.reduce((s,f)=>s+severityWeight[f.severity],0))),assets,findings,attackPaths,summary};
}

export const demoPostureReport = aggregatePostureReports([
  analyzePostureFile("k8s/payments.yaml",`apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payments-api\nspec:\n  template:\n    spec:\n      hostNetwork: true\n      containers:\n        - name: api\n          image: payments:latest\n          securityContext:\n            privileged: true\n            allowPrivilegeEscalation: true`),
  analyzePostureFile("infra/main.tf",`resource "aws_security_group" "api" { ingress { from_port = 22 to_port = 22 cidr_blocks = ["0.0.0.0/0"] } }\nresource "aws_db_instance" "main" { publicly_accessible = true }`)
]);
