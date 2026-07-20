export type AdaptiveTaskPriority = "critical" | "high" | "normal" | "low";

export interface AgentRuntimeState {
  agentId: string;
  cpuPercent: number;
  memoryPercent: number;
  batteryPercent?: number;
  onExternalPower?: boolean;
  userActive: boolean;
  networkMetered: boolean;
  runningTaskIds: string[];
}

export interface AdaptiveTask {
  id: string;
  agentId: string;
  priority: AdaptiveTaskPriority;
  cpuCost: number;
  memoryCost: number;
  requiresUnmeteredNetwork: boolean;
  canRunWhileUserActive: boolean;
  createdAt: string;
  deadlineAt?: string;
  maintenanceWindowId?: string;
}

export interface MaintenanceWindow {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface AdaptiveSchedulePolicy {
  maximumCpuPercent: number;
  maximumMemoryPercent: number;
  minimumBatteryPercent: number;
  maximumConcurrentTasks: number;
  allowCriticalBatteryOverride: boolean;
}

export interface AdaptiveScheduleDecision {
  scheduledTaskIds: string[];
  deferredTaskIds: string[];
  suspendedTaskIds: string[];
  reasons: Record<string,string>;
  decision: "schedule" | "defer" | "suspend";
}
