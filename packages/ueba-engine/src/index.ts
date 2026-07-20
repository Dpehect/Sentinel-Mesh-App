import {createHash} from "node:crypto";
import type {
  BehaviorAnomaly,
  BehaviorBaseline,
  BehaviorEvent,
  BehaviorSeverity,
  UebaReport
} from "./types.js";

export type {
  BehaviorAnomaly,
  BehaviorBaseline,
  BehaviorEvent,
  BehaviorSeverity,
  EntityType,
  UebaReport
} from "./types.js";

function anomaly(
  event: BehaviorEvent,
  ruleId: string,
  severity: BehaviorSeverity,
  score: number,
  title: string,
  evidence: string
): BehaviorAnomaly {
  const fingerprint = createHash("sha256")
    .update(`${event.entityId}|${event.timestamp}|${ruleId}|${evidence}`)
    .digest("hex");

  return {
    id:`ueba_${fingerprint.slice(0, 16)}`,
    entityId:event.entityId,
    ruleId,
    severity,
    score:Math.max(0, Math.min(100, score)),
    title,
    evidence
  };
}

export function analyzeBehavior(
  baselines: BehaviorBaseline[],
  events: BehaviorEvent[]
): UebaReport {
  const baselineByEntity = new Map(
    baselines.map(item => [item.entityId, item])
  );
  const anomalies: BehaviorAnomaly[] = [];
  const hourlyCounts = new Map<string, number>();

  for (const event of events) {
    const baseline = baselineByEntity.get(event.entityId);
    if (!baseline) {
      anomalies.push(anomaly(
        event, "UEBA-ENTITY-001", "medium", 55,
        "Entity has no established behavior baseline",
        `action=${event.action}`
      ));
      continue;
    }

    const hour = new Date(event.timestamp).getUTCHours();
    const countKey = `${event.entityId}|${event.timestamp.slice(0, 13)}`;
    hourlyCounts.set(countKey, (hourlyCounts.get(countKey) ?? 0) + 1);

    if (!baseline.usualHours.includes(hour)) {
      anomalies.push(anomaly(
        event, "UEBA-TIME-001", event.privileged ? "high" : "medium",
        event.privileged ? 80 : 60,
        "Activity occurred outside usual hours",
        `hour=${hour} action=${event.action}`
      ));
    }

    if (
      event.country &&
      baseline.usualCountries.length > 0 &&
      !baseline.usualCountries.includes(event.country)
    ) {
      anomalies.push(anomaly(
        event, "UEBA-GEO-001", event.privileged ? "critical" : "high",
        event.privileged ? 95 : 78,
        "Activity originated from an unusual country",
        `country=${event.country} sourceIp=${event.sourceIp ?? "unknown"}`
      ));
    }

    if (!baseline.usualActions.includes(event.action)) {
      anomalies.push(anomaly(
        event, "UEBA-ACTION-001", event.privileged ? "high" : "medium",
        event.privileged ? 82 : 62,
        "Entity performed an unusual action",
        `action=${event.action}`
      ));
    }

    const transfer = event.dataTransferMb ?? 0;
    if (
      baseline.averageDataTransferMb > 0 &&
      transfer >= baseline.averageDataTransferMb * 5
    ) {
      anomalies.push(anomaly(
        event, "UEBA-DATA-001", transfer >= baseline.averageDataTransferMb * 10
          ? "critical" : "high",
        transfer >= baseline.averageDataTransferMb * 10 ? 96 : 84,
        "Abnormally large data transfer detected",
        `observedMb=${transfer} baselineMb=${baseline.averageDataTransferMb}`
      ));
    }

    if (!event.success && event.privileged) {
      anomalies.push(anomaly(
        event, "UEBA-PRIV-001", "high", 75,
        "Failed privileged action detected",
        `action=${event.action}`
      ));
    }
  }

  for (const [key, count] of hourlyCounts) {
    const entityId = key.split("|")[0];
    const baseline = baselineByEntity.get(entityId);
    if (!baseline || baseline.averageEventsPerHour <= 0) continue;

    if (count >= baseline.averageEventsPerHour * 5) {
      const event = events.find(item => item.entityId === entityId)!;
      anomalies.push(anomaly(
        event, "UEBA-VOLUME-001", count >= baseline.averageEventsPerHour * 10
          ? "critical" : "high",
        count >= baseline.averageEventsPerHour * 10 ? 94 : 80,
        "Abnormal event volume detected",
        `eventsPerHour=${count} baseline=${baseline.averageEventsPerHour}`
      ));
    }
  }

  const unique = [...new Map(anomalies.map(item => [item.id, item])).values()];
  const highestScore = unique.reduce(
    (highest, item) => Math.max(highest, item.score), 0
  );

  return {
    entitiesAnalyzed:new Set(events.map(item => item.entityId)).size,
    eventsAnalyzed:events.length,
    anomalies:unique,
    highestScore,
    decision:highestScore >= 90
      ? "contain"
      : highestScore >= 60
        ? "investigate"
        : "allow"
  };
}

export function createUebaSummary(report: UebaReport): string {
  return [
    `UEBA decision: ${report.decision}`,
    `Entities analyzed: ${report.entitiesAnalyzed}`,
    `Events analyzed: ${report.eventsAnalyzed}`,
    `Anomalies: ${report.anomalies.length}`,
    `Highest anomaly score: ${report.highestScore}/100`
  ].join("\n");
}
