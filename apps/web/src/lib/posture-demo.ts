import {scanPosture} from "@sentinel/posture-intelligence";

export const postureDemo=scanPosture([
  {path:"infra/main.tf",content:`resource "aws_security_group_rule" "admin" {
  from_port = 22
  to_port = 22
  cidr_blocks = ["0.0.0.0/0"]
}
resource "aws_db_instance" "primary" {
  publicly_accessible = true
  storage_encrypted = false
  deletion_protection = false
}`},
  {path:"k8s/api.yaml",content:`apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments-api
spec:
  template:
    spec:
      hostNetwork: true
      serviceAccountName: default
      containers:
        - name: api
          image: payments:latest
          securityContext:
            privileged: true
            allowPrivilegeEscalation: true
            runAsUser: 0
            readOnlyRootFilesystem: false`},
  {path:"k8s/admin-rbac.yaml",content:`apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: broad-admin
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]`}
]);

import {buildSecurityGraph, findAttackPaths} from "@sentinel/posture-intelligence";

export const postureGraph = buildSecurityGraph(postureDemo.assets, postureDemo.findings);
export const postureAttackPaths = findAttackPaths(postureGraph);
