import {describe, expect, it} from "vitest";
import {
  createKubernetesSummary,
  evaluateKubernetesSecurity,
  shouldBlockKubernetesDeployment
} from "./index.js";

describe("kubernetes security", () => {
  it("blocks unsafe privileged workloads", () => {
    const report = evaluateKubernetesSecurity([{
      namespace:"production",
      kind:"Deployment",
      name:"payments-api",
      automountServiceAccountToken:true,
      networkPolicySelected:false,
      containers:[{
        name:"api",
        image:"company/payments:latest",
        privileged:true,
        allowPrivilegeEscalation:true,
        runAsNonRoot:false,
        readOnlyRootFilesystem:false,
        hostNetwork:true,
        capabilitiesAdded:["SYS_ADMIN"],
        resourceLimitsDefined:false,
        imagePullPolicy:"IfNotPresent"
      }]
    }]);

    expect(report.findings.some(item => item.ruleId === "K8S-POD-001")).toBe(true);
    expect(report.findings.some(item => item.ruleId === "K8S-HOST-001")).toBe(true);
    expect(shouldBlockKubernetesDeployment(report)).toBe(true);
  });

  it("allows hardened workloads", () => {
    const report = evaluateKubernetesSecurity([{
      namespace:"production",
      kind:"Deployment",
      name:"safe-api",
      automountServiceAccountToken:false,
      networkPolicySelected:true,
      containers:[{
        name:"api",
        image:"company/safe-api@sha256:abcdef",
        privileged:false,
        allowPrivilegeEscalation:false,
        runAsNonRoot:true,
        readOnlyRootFilesystem:true,
        hostNetwork:false,
        hostPID:false,
        hostIPC:false,
        capabilitiesAdded:[],
        resourceLimitsDefined:true,
        imagePullPolicy:"Always"
      }]
    }]);

    expect(report.findings).toHaveLength(0);
    expect(report.score).toBe(100);
    expect(shouldBlockKubernetesDeployment(report)).toBe(false);
  });

  it("creates a compact summary", () => {
    expect(createKubernetesSummary(
      evaluateKubernetesSecurity([])
    )).toContain("Kubernetes security score:");
  });
});
