export type KubernetesSeverity = "critical" | "high" | "medium" | "low";

export interface KubernetesContainer {
  name: string;
  image: string;
  privileged?: boolean;
  allowPrivilegeEscalation?: boolean;
  runAsNonRoot?: boolean;
  readOnlyRootFilesystem?: boolean;
  hostNetwork?: boolean;
  hostPID?: boolean;
  hostIPC?: boolean;
  capabilitiesAdded?: string[];
  resourceLimitsDefined?: boolean;
  imagePullPolicy?: string;
}

export interface KubernetesWorkload {
  namespace: string;
  kind: "Pod" | "Deployment" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";
  name: string;
  serviceAccountName?: string;
  automountServiceAccountToken?: boolean;
  containers: KubernetesContainer[];
  networkPolicySelected?: boolean;
}

export interface KubernetesFinding {
  id: string;
  ruleId: string;
  severity: KubernetesSeverity;
  workload: string;
  container?: string;
  title: string;
  remediation: string;
}

export interface KubernetesSecurityReport {
  score: number;
  workloadsChecked: number;
  containersChecked: number;
  findings: KubernetesFinding[];
}
