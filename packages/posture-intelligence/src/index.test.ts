import {describe,expect,it} from "vitest";
import {scanPosture} from "./index.js";

describe("posture intelligence",()=>{
  it("detects privileged Kubernetes workloads and public exposure",()=>{
    const result=scanPosture([{path:"k8s/api.yaml",content:`
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      hostNetwork: true
      containers:
        - image: demo:latest
          securityContext:
            privileged: true
`}]);
    expect(result.summary.critical).toBeGreaterThan(0);
    expect(result.summary.high).toBeGreaterThan(0);
    expect(result.assets[0]?.provider).toBe("kubernetes");
  });

  it("detects unrestricted Terraform ingress",()=>{
    const result=scanPosture([{path:"infra/main.tf",content:`
resource "aws_security_group_rule" "ssh" {
  from_port = 22
  to_port = 22
  cidr_blocks = ["0.0.0.0/0"]
}
`}]);
    expect(result.findings.some(f=>f.ruleId==="IAC-001")).toBe(true);
  });
});
