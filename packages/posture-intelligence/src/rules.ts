import type {PostureFinding, Severity} from "./types.js";

export interface RuleContext {
  path: string;
  content: string;
  assetId: string;
}

export interface PostureRule {
  id: string;
  title: string;
  severity: Severity;
  standards: string[];
  remediation: string;
  match(context: RuleContext): string[];
}

const regexRule = (
  id: string, title: string, severity: Severity, pattern: RegExp,
  remediation: string, standards: string[]
): PostureRule => ({
  id, title, severity, remediation, standards,
  match: ({content}) => {
    pattern.lastIndex = 0;
    const matches = content.match(pattern);
    return matches ? matches.slice(0, 5) : [];
  }
});

export const postureRules: PostureRule[] = [
  regexRule("K8S-001","Privileged container","critical",
    /privileged\s*:\s*true/gi,
    "Set securityContext.privileged to false and grant only required capabilities.",
    ["CIS Kubernetes 5.2.1","NSA Kubernetes Hardening"]),
  regexRule("K8S-002","Privilege escalation allowed","high",
    /allowPrivilegeEscalation\s*:\s*true/gi,
    "Set allowPrivilegeEscalation: false.",
    ["CIS Kubernetes 5.2.5"]),
  regexRule("K8S-003","Container runs as root","high",
    /runAsUser\s*:\s*0|runAsNonRoot\s*:\s*false/gi,
    "Set runAsNonRoot: true and use a non-zero runAsUser.",
    ["CIS Kubernetes 5.2.6"]),
  regexRule("K8S-004","Host network enabled","high",
    /hostNetwork\s*:\s*true/gi,
    "Disable hostNetwork unless explicitly required.",
    ["CIS Kubernetes 5.2.4"]),
  regexRule("K8S-005","Host PID or IPC enabled","high",
    /host(?:PID|IPC)\s*:\s*true/gi,
    "Disable hostPID and hostIPC.",
    ["CIS Kubernetes 5.2.2","CIS Kubernetes 5.2.3"]),
  regexRule("K8S-006","HostPath volume mounted","high",
    /hostPath\s*:/gi,
    "Replace hostPath with a scoped persistent volume.",
    ["CIS Kubernetes 5.2.13"]),
  regexRule("K8S-007","Writable root filesystem","medium",
    /readOnlyRootFilesystem\s*:\s*false/gi,
    "Set readOnlyRootFilesystem: true.",
    ["NSA Kubernetes Hardening"]),
  regexRule("K8S-008","Latest image tag","medium",
    /image\s*:\s*[^\s"']+:latest\b/gi,
    "Pin images to an immutable digest or version.",
    ["CIS Software Supply Chain"]),
  regexRule("K8S-009","Wildcard RBAC permission","critical",
    /(?:verbs|resources)\s*:\s*\[[^\]]*["']?\*["']?[^\]]*\]/gi,
    "Replace wildcard RBAC permissions with explicit least-privilege entries.",
    ["CIS Kubernetes 5.1.3"]),
  regexRule("K8S-010","Default service account","medium",
    /serviceAccountName\s*:\s*default\b/gi,
    "Create a dedicated service account with minimal permissions.",
    ["CIS Kubernetes 5.1.5"]),
  regexRule("K8S-011","Public LoadBalancer service","high",
    /type\s*:\s*LoadBalancer\b/gi,
    "Restrict source ranges or place the service behind an approved ingress.",
    ["CIS Kubernetes Networking"]),
  regexRule("K8S-012","Dangerous capability added","critical",
    /add\s*:\s*\[[^\]]*(SYS_ADMIN|NET_ADMIN|SYS_PTRACE)[^\]]*\]/gi,
    "Drop dangerous Linux capabilities and add only the minimum required.",
    ["CIS Kubernetes 5.2.8"]),
  regexRule("IAC-001","Unrestricted ingress","critical",
    /0\.0\.0\.0\/0|::\/0/gi,
    "Restrict ingress CIDRs to trusted networks.",
    ["CIS AWS Foundations","CIS Azure Foundations","CIS GCP Foundations"]),
  regexRule("IAC-002","Public access enabled","high",
    /publicly_accessible\s*=\s*true|public_access\s*=\s*true|acl\s*=\s*["']public-read/gi,
    "Disable public access and use explicit private access paths.",
    ["CIS Cloud Foundations"]),
  regexRule("IAC-003","IAM wildcard action","critical",
    /["']Action["']\s*:\s*["']\*["']|actions?\s*=\s*\[[^\]]*["']\*["']/gi,
    "Replace wildcard IAM actions with explicitly required actions.",
    ["CIS IAM","NIST AC-6"]),
  regexRule("IAC-004","IAM wildcard resource","high",
    /["']Resource["']\s*:\s*["']\*["']|resources?\s*=\s*\[[^\]]*["']\*["']/gi,
    "Scope IAM resources to explicit ARNs or resource identifiers.",
    ["CIS IAM","NIST AC-6"]),
  regexRule("IAC-005","Encryption disabled","high",
    /encrypted\s*=\s*false|storage_encrypted\s*=\s*false/gi,
    "Enable encryption at rest using a managed or customer-controlled key.",
    ["CIS Cloud Foundations","NIST SC-28"]),
  regexRule("IAC-006","Deletion protection disabled","medium",
    /deletion_protection\s*=\s*false/gi,
    "Enable deletion protection for production data services.",
    ["NIST CP-10"]),
  regexRule("IAC-007","Sensitive management port exposed","critical",
    /(?:from_port|to_port)\s*=\s*(22|3389)[\s\S]{0,300}(0\.0\.0\.0\/0|::\/0)/gi,
    "Restrict SSH/RDP to a bastion or trusted administrative CIDR.",
    ["CIS Cloud Foundations"]),
  regexRule("DOCKER-001","Privileged Docker service","critical",
    /privileged\s*:\s*true/gi,
    "Remove privileged mode and grant only required capabilities.",
    ["CIS Docker 5.4"]),
  regexRule("DOCKER-002","Docker host socket mounted","critical",
    /\/var\/run\/docker\.sock/gi,
    "Do not mount the Docker socket into application containers.",
    ["CIS Docker 5.31"]),
  regexRule("DOCKER-003","Host network mode","high",
    /network_mode\s*:\s*host/gi,
    "Use an isolated user-defined network.",
    ["CIS Docker 5.9"])
];

export function evaluateRules(path: string, content: string, assetId: string): PostureFinding[] {
  return postureRules.flatMap(rule => {
    const evidence = rule.match({path, content, assetId});
    if (!evidence.length) return [];
    return [{
      id: `${assetId}:${rule.id}`,
      ruleId: rule.id,
      title: rule.title,
      severity: rule.severity,
      confidence: 0.94,
      assetId,
      source: path,
      evidence,
      remediation: rule.remediation,
      standards: rule.standards
    }];
  });
}
