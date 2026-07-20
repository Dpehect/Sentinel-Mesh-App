import {createHash} from "node:crypto";
import type {
  CorrelatedIncident,
  CorrelationReport,
  CorrelationRule,
  SecurityEvent
} from "./types.js";

export type {
  CorrelatedIncident,
  CorrelationReport,
  CorrelationRule,
  SecurityEvent,
  SecurityEventSeverity
} from "./types.js";

function groupValue(
  event: SecurityEvent,
  key: CorrelationRule["groupBy"]
): string | undefined {
  if (key === "tenantId") return event.tenantId;
  return event[key];
}

function withinWindow(
  first: SecurityEvent,
  last: SecurityEvent,
  windowMinutes: number
): boolean {
  return (
    new Date(last.timestamp).getTime() -
    new Date(first.timestamp).getTime()
  ) <= windowMinutes * 60 * 1000;
}

export function correlateSecurityEvents(
  events: SecurityEvent[],
  rules: CorrelationRule[]
): CorrelationReport {
  const sorted = [...events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const incidents: CorrelatedIncident[] = [];

  for (const rule of rules) {
    const applicable = sorted.filter(event =>
      rule.eventTypes.includes(event.type)
    );
    const groups = new Map<string, SecurityEvent[]>();

    for (const event of applicable) {
      const value = groupValue(event, rule.groupBy);
      if (!value) continue;
      const key = `${event.tenantId}|${value}`;
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }

    for (const [key, groupedEvents] of groups) {
      for (let start = 0; start < groupedEvents.length; start += 1) {
        const windowEvents: SecurityEvent[] = [];

        for (let end = start; end < groupedEvents.length; end += 1) {
          if (!withinWindow(groupedEvents[start], groupedEvents[end], rule.windowMinutes)) {
            break;
          }
          windowEvents.push(groupedEvents[end]);
        }

        const uniqueEventTypes = new Set(windowEvents.map(event => event.type));
        const sources = [...new Set(windowEvents.map(event => event.source))];
        const requiredSourcesMet = !rule.requiredSources ||
          rule.requiredSources.every(source => sources.includes(source));

        if (
          windowEvents.length < rule.minimumMatches ||
          uniqueEventTypes.size < Math.min(rule.eventTypes.length, rule.minimumMatches) ||
          !requiredSourcesMet
        ) {
          continue;
        }

        const [tenantId, value] = key.split("|");
        const eventIds = [...new Set(windowEvents.map(event => event.id))];
        const fingerprint = createHash("sha256")
          .update(`${rule.id}|${tenantId}|${value}|${eventIds.join("|")}`)
          .digest("hex");

        const confidence = Math.min(100, Math.round(
          45 +
          eventIds.length * 8 +
          sources.length * 10 +
          (requiredSourcesMet ? 10 : 0)
        ));

        incidents.push({
          id:`incident_${fingerprint.slice(0, 16)}`,
          ruleId:rule.id,
          tenantId,
          groupValue:value,
          severity:rule.severity,
          eventIds,
          sources,
          startedAt:windowEvents[0].timestamp,
          endedAt:windowEvents[windowEvents.length - 1].timestamp,
          confidence
        });

        break;
      }
    }
  }

  const deduplicated = [...new Map(
    incidents.map(incident => [incident.id, incident])
  ).values()];

  const highestConfidence = deduplicated.reduce(
    (highest, incident) => Math.max(highest, incident.confidence),
    0
  );

  const decision = deduplicated.some(incident =>
    incident.severity === "critical" && incident.confidence >= 75
  )
    ? "escalate"
    : highestConfidence >= 60
      ? "investigate"
      : "allow";

  return {
    eventsProcessed:events.length,
    incidents:deduplicated,
    highestConfidence,
    decision
  };
}

export function createCorrelationSummary(
  report: CorrelationReport
): string {
  return [
    `SIEM decision: ${report.decision}`,
    `Events processed: ${report.eventsProcessed}`,
    `Incidents created: ${report.incidents.length}`,
    `Highest confidence: ${report.highestConfidence}/100`
  ].join("\n");
}
