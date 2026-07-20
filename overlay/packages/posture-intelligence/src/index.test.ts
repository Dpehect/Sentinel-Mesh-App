import test from "node:test";
import assert from "node:assert/strict";
import {analyzePostureFile, demoPostureReport} from "./index.js";

test("detects privileged Kubernetes workloads",()=>{
  const report=analyzePostureFile("pod.yaml","kind: Pod\nmetadata:\n  name: unsafe\nspec:\n  hostPID: true\n  containers:\n  - image: app:latest\n    securityContext:\n      privileged: true");
  assert.ok(report.findings.some((f)=>f.ruleId==="K8S-001"));
  assert.ok(report.findings.some((f)=>f.ruleId==="K8S-005"));
});

test("detects Terraform public exposure",()=>{
  const report=analyzePostureFile("main.tf",'resource "aws_security_group" "x" { ingress { cidr_blocks = ["0.0.0.0/0"] } }');
  assert.ok(report.findings.some((f)=>f.ruleId==="TF-001"));
});

test("builds explainable demo posture report",()=>{
  assert.ok(demoPostureReport.findings.length >= 4);
  assert.ok(demoPostureReport.attackPaths.length >= 1);
  assert.ok(demoPostureReport.score < 100);
});
