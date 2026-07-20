import type {
  IncidentEvaluation,
  IncidentSeverity,
  IncidentSla,
  IncidentStatus,
  SecurityIncident
} from "./types.js";

export type {
  IncidentEvaluation,
  IncidentSeverity,
  IncidentSla,
  IncidentStatus,
  SecurityIncident
} from "./types.js";

export const defaultIncidentSlas: Record<IncidentSeverity, IncidentSla> = {
  "sev-1":{acknowledgeMinutes:15, containMinutes:60, recoverMinutes:240},
  "sev-2":{acknowledgeMinutes:30, containMinutes:240, recoverMinutes:720},
  "sev-3":{acknowledgeMinutes:120, containMinutes:720, recoverMinutes:1440},
  "sev-4":{acknowledgeMinutes:480, containMinutes:1440, recoverMinutes:4320}
};

const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  declared:["investigating"],
  investigating:["contained"],
  contained:["eradicated"],
  eradicated:["recovered"],
  recovered:["closed"],
  closed:[]
};

export function canTransitionIncident(
  from: IncidentStatus,
  to: IncidentStatus
): boolean {
  return allowedTransitions[from].includes(to);
}

export function transitionIncident(
  incident: SecurityIncident,
  to: IncidentStatus
): SecurityIncident {
  if (!canTransitionIncident(incident.status, to)) {
    throw new Error("INVALID_INCIDENT_TRANSITION");
  }

  return {...incident, status:to};
}

function elapsedMinutes(start: string, end?: string, now?: Date): number {
  const endTime = end ? new Date(end).getTime() : (now ?? new Date()).getTime();
  return Math.max(0, (endTime - new Date(start).getTime()) / 60000);
}

export function evaluateIncidentSla(
  incident: SecurityIncident,
  now = new Date(),
  sla: IncidentSla = defaultIncidentSlas[incident.severity]
): IncidentEvaluation {
  const acknowledgementMet =
    elapsedMinutes(incident.declaredAt, incident.acknowledgedAt, now) <= sla.acknowledgeMinutes;

  const containmentMet =
    elapsedMinutes(incident.declaredAt, incident.containedAt, now) <= sla.containMinutes;

  const recoveryMet =
    elapsedMinutes(incident.declaredAt, incident.recoveredAt, now) <= sla.recoverMinutes;

  const overdueActions: string[] = [];
  if (!acknowledgementMet) overdueActions.push("ACKNOWLEDGEMENT_OVERDUE");
  if (!containmentMet) overdueActions.push("CONTAINMENT_OVERDUE");
  if (!recoveryMet) overdueActions.push("RECOVERY_OVERDUE");

  return {
    acknowledgementMet,
    containmentMet,
    recoveryMet,
    overdueActions
  };
}

export function classifyIncident(
  criticalAssetsAffected: number,
  confirmedDataExposure: boolean,
  productionUnavailable: boolean
): IncidentSeverity {
  if (confirmedDataExposure || productionUnavailable || criticalAssetsAffected >= 3) {
    return "sev-1";
  }

  if (criticalAssetsAffected >= 1) return "sev-2";
  return "sev-3";
}
