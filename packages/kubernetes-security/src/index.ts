import {createHash} from "node:crypto";
import type {
  KubernetesContainer,
  KubernetesFinding,
  KubernetesSecurityReport,
  KubernetesSeverity,
  KubernetesWorkload
} from "./types.js";

export type {
  KubernetesContainer,
  KubernetesFinding,
  KubernetesSecurityReport,
  KubernetesSeverity,
  KubernetesWorkload
} from "./types.js";

const weights: Record<KubernetesSeverity, number> = {
  critical:30, high:18, medium:8, low:3
};

function finding(
  workload: KubernetesWorkload,
  ruleId: string,
  severity: KubernetesSeverity,
  title: string,
  remediation: string,
  container?: KubernetesContainer
): KubernetesFinding {
  const resource = `${workload.namespace}/${workload.kind}/${workload.name}`;
  const fingerprint = createHash("sha256")
    .update(`${resource}|${container?.name ?? ""}|${ruleId}`)
    .digest("hex");

  return {
    id:`k8s_${fingerprint.slice(0, 16)}`,
    ruleId, severity, workload:resource,
    container:container?.name, title, remediation
  };
}

export function evaluateKubernetesSecurity(
  workloads: KubernetesWorkload[]
): KubernetesSecurityReport {
  const findings: KubernetesFinding[] = [];
  let containersChecked = 0;

  for (const workload of workloads) {
    if (workload.automountServiceAccountToken !== false) {
      findings.push(finding(workload, "K8S-IAM-001", "medium",
        "Service account token is automatically mounted",
        "Disable token automount unless Kubernetes API access is required."));
    }

    if (workload.networkPolicySelected !== true) {
      findings.push(finding(workload, "K8S-NET-001", "high",
        "Workload is not protected by a NetworkPolicy",
        "Apply default-deny ingress and egress NetworkPolicies."));
    }

    for (const container of workload.containers) {
      containersChecked += 1;

      if (container.privileged === true) {
        findings.push(finding(workload, "K8S-POD-001", "critical",
          "Privileged container is enabled",
          "Disable privileged mode and grant only required capabilities.", container));
      }

      if (container.allowPrivilegeEscalation !== false) {
        findings.push(finding(workload, "K8S-POD-002", "high",
          "Privilege escalation is not disabled",
          "Set allowPrivilegeEscalation to false.", container));
      }

      if (container.runAsNonRoot !== true) {
        findings.push(finding(workload, "K8S-POD-003", "high",
          "Container may run as root",
          "Set runAsNonRoot to true and use a non-root image user.", container));
      }

      if (container.readOnlyRootFilesystem !== true) {
        findings.push(finding(workload, "K8S-POD-004", "medium",
          "Root filesystem is writable",
          "Set readOnlyRootFilesystem to true.", container));
      }

      if (container.hostNetwork || container.hostPID || container.hostIPC) {
        findings.push(finding(workload, "K8S-HOST-001", "critical",
          "Workload shares host namespaces",
          "Disable hostNetwork, hostPID and hostIPC.", container));
      }

      const dangerous = new Set(["SYS_ADMIN","NET_ADMIN","SYS_PTRACE","DAC_OVERRIDE","ALL"]);
      if ((container.capabilitiesAdded ?? []).some(cap => dangerous.has(cap))) {
        findings.push(finding(workload, "K8S-CAP-001", "critical",
          "Dangerous Linux capability is added",
          "Drop all capabilities and restore only the minimum set.", container));
      }

      if (container.resourceLimitsDefined !== true) {
        findings.push(finding(workload, "K8S-RES-001", "medium",
          "CPU or memory limits are missing",
          "Define CPU and memory requests and limits.", container));
      }

      if (container.image.endsWith(":latest") ||
          (!container.image.includes("@sha256:") && !container.image.includes(":"))) {
        findings.push(finding(workload, "K8S-IMAGE-001", "medium",
          "Container image is not immutably pinned",
          "Pin the image to a digest or explicit non-latest version.", container));
      }

      if (container.imagePullPolicy !== "Always") {
        findings.push(finding(workload, "K8S-IMAGE-002", "low",
          "Image pull policy is not Always",
          "Use Always for mutable tags or prefer immutable digests.", container));
      }
    }
  }

  const penalty = findings.reduce((sum, item) => sum + weights[item.severity], 0);
  return {
    score:Math.max(0, Math.min(100, 100 - penalty)),
    workloadsChecked:workloads.length,
    containersChecked,
    findings
  };
}

export function shouldBlockKubernetesDeployment(
  report: KubernetesSecurityReport,
  minimumScore = 70
): boolean {
  return report.score < minimumScore ||
    report.findings.some(item => item.severity === "critical");
}

export function createKubernetesSummary(report: KubernetesSecurityReport): string {
  return [
    `Kubernetes security score: ${report.score}/100`,
    `Workloads checked: ${report.workloadsChecked}`,
    `Containers checked: ${report.containersChecked}`,
    `Findings: ${report.findings.length}`,
    `Critical findings: ${report.findings.filter(item => item.severity === "critical").length}`
  ].join("\n");
}
