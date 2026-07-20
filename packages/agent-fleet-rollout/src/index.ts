import type {
  RolloutDecision,
  RolloutEvent,
  RolloutPlan,
  RolloutSafetyPolicy,
  WaveExecutionReport
} from "./types.js";

export type {
  AgentExecutionResult,
  PlannedWave,
  PlannedWaveAgent,
  RolloutAction,
  RolloutDecision,
  RolloutEvent,
  RolloutOperation,
  RolloutPlan,
  RolloutSafetyPolicy,
  RolloutState,
  WaveExecutionReport
} from "./types.js";

function uniqueEvents(events: RolloutEvent[]): {
  accepted: RolloutEvent[];
  duplicateEvents: string[];
} {
  const seen = new Set<string>();
  const accepted: RolloutEvent[] = [];
  const duplicateEvents: string[] = [];

  for (const event of [...events].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
  )) {
    if (seen.has(event.idempotencyKey)) {
      duplicateEvents.push(event.eventId);
      continue;
    }
    seen.add(event.idempotencyKey);
    accepted.push(event);
  }

  return { accepted, duplicateEvents };
}

function failureRate(report?: WaveExecutionReport): number {
  if (!report || report.results.length === 0) return 0;
  const attempted = report.results.filter(item => item.outcome !== "skipped");
  if (attempted.length === 0) return 0;
  const failed = attempted.filter(item => item.outcome === "failed").length;
  return failed / attempted.length;
}

function successfulCount(report?: WaveExecutionReport): number {
  if (!report) return 0;
  return report.results.filter(item => item.outcome === "succeeded").length;
}

export function decideRolloutState(
  plan: RolloutPlan,
  events: RolloutEvent[],
  reports: WaveExecutionReport[],
  policy: RolloutSafetyPolicy
): RolloutDecision {
  const { accepted, duplicateEvents } = uniqueEvents(
    events.filter(event => event.rolloutId === plan.rolloutId)
  );

  const completedWaves = accepted
    .filter(event => event.action === "complete-wave")
    .map(event => event.wave)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);

  const rollbackEvent = [...accepted]
    .reverse()
    .find(event => event.action === "rollback-wave");

  if (rollbackEvent) {
    return {
      state: "rolling-back",
      nextAction: "none",
      reason: `Wave ${rollbackEvent.wave} rollback is in progress`,
      activeWave: rollbackEvent.wave,
      completedWaves,
      failureRate: 0,
      duplicateEvents
    };
  }

  const pauseEvent = [...accepted]
    .reverse()
    .find(event => event.action === "pause-rollout" || event.action === "resume-rollout");

  if (pauseEvent?.action === "pause-rollout") {
    return {
      state: "paused",
      nextAction: "none",
      reason: "Rollout is paused by an explicit control event",
      activeWave: pauseEvent.wave || null,
      completedWaves,
      failureRate: 0,
      duplicateEvents
    };
  }

  const startedWaves = accepted
    .filter(event => event.action === "start-wave")
    .map(event => event.wave);

  if (startedWaves.length === 0) {
    return {
      state: "pending",
      nextAction: "start-first-wave",
      reason: "No rollout wave has started",
      activeWave: null,
      completedWaves,
      failureRate: 0,
      duplicateEvents
    };
  }

  const activeWave = Math.max(...startedWaves);
  const report = reports
    .filter(item => item.rolloutId === plan.rolloutId && item.wave === activeWave)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0];

  const currentFailureRate = failureRate(report);
  const currentWaveCompleted = completedWaves.includes(activeWave);

  if (!report && !currentWaveCompleted) {
    return {
      state: "running",
      nextAction: "await-wave-results",
      reason: `Wave ${activeWave} is running and has no execution report yet`,
      activeWave,
      completedWaves,
      failureRate: 0,
      duplicateEvents
    };
  }

  if (
    currentFailureRate > policy.maximumFailureRate &&
    !currentWaveCompleted
  ) {
    return {
      state: policy.automaticRollback ? "failed" : "paused",
      nextAction: policy.automaticRollback
        ? "rollback-current-wave"
        : "none",
      reason: `Wave ${activeWave} failure rate exceeded the safety threshold`,
      activeWave,
      completedWaves,
      failureRate: currentFailureRate,
      duplicateEvents
    };
  }

  const isCanaryWave = activeWave === plan.waves[0]?.wave;
  if (
    isCanaryWave &&
    successfulCount(report) < policy.minimumSuccessCountForCanary &&
    !currentWaveCompleted
  ) {
    return {
      state: "paused",
      nextAction: "none",
      reason: "Canary wave did not reach the minimum successful-agent count",
      activeWave,
      completedWaves,
      failureRate: currentFailureRate,
      duplicateEvents
    };
  }

  if (!currentWaveCompleted) {
    return {
      state: "running",
      nextAction: "await-approval",
      reason: "Wave results are acceptable but the wave is not marked complete",
      activeWave,
      completedWaves,
      failureRate: currentFailureRate,
      duplicateEvents
    };
  }

  const allWavesCompleted = plan.waves.every(wave =>
    completedWaves.includes(wave.wave)
  );

  if (allWavesCompleted) {
    return {
      state: "completed",
      nextAction: "complete-rollout",
      reason: "All rollout waves completed successfully",
      activeWave,
      completedWaves,
      failureRate: currentFailureRate,
      duplicateEvents
    };
  }

  if (policy.requireApprovalBeforeNextWave) {
    const approval = accepted.find(event =>
      event.action === "resume-rollout" &&
      event.wave === activeWave
    );

    if (!approval) {
      return {
        state: "paused",
        nextAction: "await-approval",
        reason: `Wave ${activeWave} completed and approval is required`,
        activeWave,
        completedWaves,
        failureRate: currentFailureRate,
        duplicateEvents
      };
    }
  }

  return {
    state: "running",
    nextAction: "start-next-wave",
    reason: "Current wave completed within safety thresholds",
    activeWave,
    completedWaves,
    failureRate: currentFailureRate,
    duplicateEvents
  };
}

export function createRolloutEvent(
  input: Omit<RolloutEvent, "eventId" | "occurredAt">,
  now = new Date()
): RolloutEvent {
  const safeKey = input.idempotencyKey.trim();
  if (!safeKey) {
    throw new Error("idempotencyKey is required");
  }

  return {
    ...input,
    eventId: `${input.rolloutId}:${input.wave}:${input.action}:${safeKey}`,
    occurredAt: now.toISOString(),
    idempotencyKey: safeKey
  };
}

export function createRolloutDecisionSummary(
  decision: RolloutDecision
): string {
  return [
    `Rollout state: ${decision.state}`,
    `Next action: ${decision.nextAction}`,
    `Active wave: ${decision.activeWave ?? "none"}`,
    `Completed waves: ${decision.completedWaves.join(",") || "none"}`,
    `Failure rate: ${(decision.failureRate * 100).toFixed(1)}%`,
    `Duplicate events ignored: ${decision.duplicateEvents.length}`
  ].join("\n");
}
