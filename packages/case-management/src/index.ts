import type {
  CaseEvaluation,
  CaseSeverity,
  CaseSla,
  CaseStatus,
  SecurityCase,
  SecurityCaseTask
} from "./types.js";

export type {
  CaseEvaluation,
  CaseSeverity,
  CaseSla,
  CaseStatus,
  SecurityCase,
  SecurityCaseTask,
  TaskStatus
} from "./types.js";

export const defaultCaseSlas: Record<CaseSeverity, CaseSla> = {
  critical:{acknowledgeMinutes:15, resolveMinutes:240},
  high:{acknowledgeMinutes:60, resolveMinutes:1440},
  medium:{acknowledgeMinutes:240, resolveMinutes:4320},
  low:{acknowledgeMinutes:1440, resolveMinutes:10080}
};

const transitions: Record<CaseStatus, CaseStatus[]> = {
  open:["triage"],
  triage:["investigating"],
  investigating:["contained","resolved"],
  contained:["resolved"],
  resolved:["closed"],
  closed:[]
};

export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return transitions[from].includes(to);
}

export function transitionCase(
  securityCase: SecurityCase,
  to: CaseStatus,
  updatedAt = new Date().toISOString()
): SecurityCase {
  if (!canTransitionCase(securityCase.status, to)) {
    throw new Error("INVALID_CASE_TRANSITION");
  }

  return {...securityCase, status:to, updatedAt};
}

export function addCaseTask(
  securityCase: SecurityCase,
  task: SecurityCaseTask,
  updatedAt = new Date().toISOString()
): SecurityCase {
  if (securityCase.tasks.some(item => item.id === task.id)) {
    throw new Error("DUPLICATE_CASE_TASK");
  }

  return {
    ...securityCase,
    updatedAt,
    tasks:[...securityCase.tasks, task]
  };
}

export function evaluateCase(
  securityCase: SecurityCase,
  now = new Date(),
  sla: CaseSla = defaultCaseSlas[securityCase.severity]
): CaseEvaluation {
  const created = new Date(securityCase.createdAt).getTime();
  const ageMinutes = Math.max(0, (now.getTime() - created) / 60000);
  const terminal = securityCase.status === "resolved" || securityCase.status === "closed";

  const blockedTasks = securityCase.tasks
    .filter(task => task.status === "blocked")
    .map(task => task.id);

  const overdueTasks = securityCase.tasks
    .filter(task =>
      task.status !== "done" &&
      task.dueAt !== undefined &&
      new Date(task.dueAt).getTime() <= now.getTime()
    )
    .map(task => task.id);

  const completed = securityCase.tasks.filter(task => task.status === "done").length;
  const completionPercent = securityCase.tasks.length
    ? Math.round((completed / securityCase.tasks.length) * 100)
    : 0;

  const unassigned = !securityCase.ownerId;
  const acknowledgementOverdue =
    ["open","triage"].includes(securityCase.status) &&
    ageMinutes > sla.acknowledgeMinutes;

  const resolutionOverdue = !terminal && ageMinutes > sla.resolveMinutes;
  const overdue = acknowledgementOverdue || resolutionOverdue;

  return {
    overdue,
    unassigned,
    blockedTasks,
    overdueTasks,
    completionPercent,
    escalationRequired:
      overdue ||
      unassigned ||
      blockedTasks.length > 0 ||
      overdueTasks.length > 0
  };
}

export function mergeCaseEvidence(
  securityCase: SecurityCase,
  evidenceIds: string[],
  updatedAt = new Date().toISOString()
): SecurityCase {
  return {
    ...securityCase,
    updatedAt,
    evidenceIds:[...new Set([...securityCase.evidenceIds, ...evidenceIds])]
  };
}
