export type ProtectionEventType =
  | "service-stop"
  | "binary-write"
  | "binary-delete"
  | "config-write"
  | "config-delete"
  | "permission-change"
  | "watchdog-missed"
  | "debugger-attach"
  | "uninstall-attempt";

export interface ProtectionEvent {
  id: string;
  tenantId: string;
  agentId: string;
  timestamp: string;
  type: ProtectionEventType;
  actorProcess?: string;
  actorSigner?: string;
  targetPath?: string;
  authorizedMaintenanceId?: string;
}

export interface MaintenanceWindow {
  id: string;
  tenantId: string;
  agentIds: string[];
  startsAt: string;
  endsAt: string;
  allowedEventTypes: ProtectionEventType[];
  approvedBy: string;
}

export interface ProtectionPolicy {
  trustedActorSigners: string[];
  protectedPaths: string[];
  maximumWatchdogGapSeconds: number;
}

export interface ProtectionFinding {
  eventId: string;
  severity: "critical" | "high" | "medium";
  code: string;
  action: "alert" | "restore" | "quarantine";
}

export interface SelfProtectionReport {
  findings: ProtectionFinding[];
  authorizedEvents: string[];
  restoreTargets: string[];
  quarantineAgents: string[];
  decision: "healthy" | "repair" | "quarantine";
}
