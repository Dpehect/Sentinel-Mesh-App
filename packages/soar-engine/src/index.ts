export interface Alert {
  id?: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  tenantId?: string;
  assetId?: string;
}

export interface Playbook {
  name: string;
  matches: string[];
  actions: string[];
  enabled?: boolean;
  minimumSeverity?: Alert["severity"];
}

export interface SoarDecision {
  playbook?: string;
  actions: string[];
  requiresApproval: boolean;
}

const severityRank = {low:1, medium:2, high:3, critical:4} as const;

export function executePlaybooks(
  alert: Alert,
  playbooks: Playbook[]
): SoarDecision {
  const playbook = playbooks.find(item =>
    item.enabled !== false &&
    (item.matches.includes(alert.type) || item.matches.includes(alert.severity)) &&
    (!item.minimumSeverity ||
      severityRank[alert.severity] >= severityRank[item.minimumSeverity])
  );

  if (!playbook) {
    return {
      actions:["notify-security-team"],
      requiresApproval:false
    };
  }

  const destructiveActions = new Set([
    "isolate-asset","disable-user","revoke-token","block-ip","rollback-deployment"
  ]);

  return {
    playbook:playbook.name,
    actions:[...new Set(playbook.actions)],
    requiresApproval:playbook.actions.some(action => destructiveActions.has(action))
  };
}
