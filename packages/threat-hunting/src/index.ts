import type {
  HuntCondition,
  HuntEvent,
  HuntMatch,
  HuntQuery,
  HuntReport
} from "./types.js";

export type {
  HuntCondition,
  HuntEvent,
  HuntMatch,
  HuntOperator,
  HuntQuery,
  HuntReport
} from "./types.js";

function readField(event: HuntEvent, field: string): unknown {
  if (field === "source") return event.source;
  if (field === "type") return event.type;
  if (field === "entityId") return event.entityId;
  if (field === "assetId") return event.assetId;
  return event.fields[field];
}

export function matchesCondition(
  event: HuntEvent,
  condition: HuntCondition
): boolean {
  const actual = readField(event, condition.field);
  const expected = condition.value;

  if (condition.operator === "equals") return actual === expected;

  if (condition.operator === "contains") {
    if (Array.isArray(actual)) return actual.includes(String(expected));
    return String(actual ?? "").toLowerCase()
      .includes(String(expected).toLowerCase());
  }

  if (condition.operator === "starts-with") {
    return String(actual ?? "").toLowerCase()
      .startsWith(String(expected).toLowerCase());
  }

  if (condition.operator === "ends-with") {
    return String(actual ?? "").toLowerCase()
      .endsWith(String(expected).toLowerCase());
  }

  if (condition.operator === "greater-than") {
    return Number(actual) > Number(expected);
  }

  if (condition.operator === "less-than") {
    return Number(actual) < Number(expected);
  }

  if (condition.operator === "in") {
    return Array.isArray(expected) && expected.includes(String(actual));
  }

  return false;
}

export function runHuntQuery(
  query: HuntQuery,
  events: HuntEvent[]
): HuntMatch | undefined {
  const applicable = events.filter(event =>
    query.sources.length === 0 || query.sources.includes(event.source)
  );

  const matching = applicable.filter(event => {
    const results = query.conditions.map(condition =>
      matchesCondition(event, condition)
    );

    return query.conditionMode === "all"
      ? results.every(Boolean)
      : results.some(Boolean);
  }).sort((a,b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (matching.length < (query.minimumMatches ?? 1)) return undefined;

  const sourceDiversity = new Set(matching.map(item=>item.source)).size;
  const entityDiversity = new Set(
    matching.map(item=>item.entityId).filter(Boolean)
  ).size;

  const confidence = Math.min(100, Math.round(
    45 +
    matching.length * 7 +
    sourceDiversity * 8 +
    Math.min(15, entityDiversity * 3)
  ));

  return {
    queryId:query.id,
    eventIds:matching.map(item=>item.id),
    entityIds:[...new Set(
      matching.map(item=>item.entityId).filter((v):v is string=>Boolean(v))
    )],
    assetIds:[...new Set(
      matching.map(item=>item.assetId).filter((v):v is string=>Boolean(v))
    )],
    evidenceIds:[...new Set(matching.flatMap(item=>item.evidenceIds ?? []))],
    firstSeenAt:matching[0].timestamp,
    lastSeenAt:matching[matching.length-1].timestamp,
    confidence
  };
}

export function runThreatHunt(
  queries: HuntQuery[],
  events: HuntEvent[]
): HuntReport {
  const matches = queries.flatMap(query => {
    const match = runHuntQuery(query, events);
    return match ? [match] : [];
  });

  const confirmedHypotheses = matches
    .filter(match => match.confidence >= 70)
    .map(match => {
      const query = queries.find(item=>item.id===match.queryId)!;
      return query.hypothesis;
    });

  const decision = matches.some(match=>match.confidence>=85)
    ? "escalate"
    : matches.length > 0
      ? "review"
      : "no-findings";

  return {
    queriesRun:queries.length,
    eventsAnalyzed:events.length,
    matches,
    confirmedHypotheses,
    decision
  };
}

export function createHuntSummary(report:HuntReport):string {
  return [
    `Threat-hunt decision: ${report.decision}`,
    `Queries run: ${report.queriesRun}`,
    `Events analyzed: ${report.eventsAnalyzed}`,
    `Matches: ${report.matches.length}`,
    `Confirmed hypotheses: ${report.confirmedHypotheses.length}`
  ].join("\n");
}
