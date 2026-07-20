import {createHash} from "node:crypto";
import type {
  IndicatorType,
  Observable,
  StixIndicatorLike,
  ThreatIndicator,
  ThreatIntelReport,
  ThreatMatch,
  ThreatSeverity
} from "./types.js";

export type {
  IndicatorType,
  Observable,
  StixIndicatorLike,
  ThreatIndicator,
  ThreatIntelReport,
  ThreatMatch,
  ThreatSeverity
} from "./types.js";

const severityWeight: Record<ThreatSeverity, number> = {
  critical:100,
  high:80,
  medium:55,
  low:25
};

function normalize(type: IndicatorType, value: string): string {
  const trimmed = value.trim();

  if (type === "domain" || type === "email") return trimmed.toLowerCase();
  if (type === "url") {
    try {
      const url = new URL(trimmed);
      url.hash = "";
      return url.toString().replace(/\/$/, "");
    } catch {
      return trimmed.toLowerCase();
    }
  }

  if (["sha256","sha1","md5"].includes(type)) return trimmed.toLowerCase();
  return trimmed;
}

function createIndicatorId(type: IndicatorType, value: string): string {
  const hash = createHash("sha256")
    .update(`${type}|${normalize(type, value)}`)
    .digest("hex");

  return `ioc_${hash.slice(0, 16)}`;
}

export function createIndicator(
  input: Omit<ThreatIndicator, "id">
): ThreatIndicator {
  return {
    ...input,
    id:createIndicatorId(input.type, input.value),
    value:normalize(input.type, input.value),
    confidence:Math.max(0, Math.min(100, input.confidence))
  };
}

export function isIndicatorActive(
  indicator: ThreatIndicator,
  now = new Date()
): boolean {
  if (!indicator.expiresAt) return true;
  return new Date(indicator.expiresAt).getTime() > now.getTime();
}

function parseStixPattern(
  pattern: string
): {type: IndicatorType; value: string} | undefined {
  const mappings: Array<[RegExp, IndicatorType]> = [
    [/\[ipv4-addr:value\s*=\s*'([^']+)'\]/i, "ipv4"],
    [/\[ipv6-addr:value\s*=\s*'([^']+)'\]/i, "ipv6"],
    [/\[domain-name:value\s*=\s*'([^']+)'\]/i, "domain"],
    [/\[url:value\s*=\s*'([^']+)'\]/i, "url"],
    [/\[email-addr:value\s*=\s*'([^']+)'\]/i, "email"],
    [/\[file:hashes\.'SHA-256'\s*=\s*'([^']+)'\]/i, "sha256"],
    [/\[file:hashes\.'SHA-1'\s*=\s*'([^']+)'\]/i, "sha1"],
    [/\[file:hashes\.MD5\s*=\s*'([^']+)'\]/i, "md5"]
  ];

  for (const [regex, type] of mappings) {
    const match = pattern.match(regex);
    if (match) return {type, value:match[1]};
  }

  return undefined;
}

export function importStixIndicators(
  objects: StixIndicatorLike[],
  source = "local-stix"
): ThreatIndicator[] {
  return objects.flatMap(object => {
    const parsed = parseStixPattern(object.pattern);
    if (!parsed) return [];

    return [createIndicator({
      type:parsed.type,
      value:parsed.value,
      severity:(object.labels ?? []).includes("critical")
        ? "critical"
        : (object.labels ?? []).includes("high")
          ? "high"
          : "medium",
      confidence:object.confidence ?? 60,
      source,
      labels:object.labels ?? [],
      firstSeenAt:object.created,
      lastSeenAt:object.modified,
      expiresAt:object.valid_until
    })];
  });
}

export function matchThreatIntelligence(
  indicators: ThreatIndicator[],
  observables: Observable[],
  now = new Date()
): ThreatIntelReport {
  const activeIndicators = indicators.filter(item => isIndicatorActive(item, now));
  const index = new Map<string, ThreatIndicator[]>();

  for (const indicator of activeIndicators) {
    const key = `${indicator.type}|${normalize(indicator.type, indicator.value)}`;
    index.set(key, [...(index.get(key) ?? []), indicator]);
  }

  const matches: ThreatMatch[] = [];

  for (const observable of observables) {
    const key = `${observable.type}|${normalize(observable.type, observable.value)}`;
    for (const indicator of index.get(key) ?? []) {
      const riskScore = Math.round(
        severityWeight[indicator.severity] * (indicator.confidence / 100)
      );

      matches.push({
        indicatorId:indicator.id,
        observable:{...observable, value:normalize(observable.type, observable.value)},
        severity:indicator.severity,
        confidence:indicator.confidence,
        riskScore,
        labels:indicator.labels
      });
    }
  }

  const highestRiskScore = matches.reduce(
    (highest, item) => Math.max(highest, item.riskScore),
    0
  );

  const decision =
    matches.some(item => item.severity === "critical" && item.confidence >= 70) ||
    highestRiskScore >= 80
      ? "block"
      : highestRiskScore >= 50
        ? "warn"
        : "allow";

  return {
    indicatorsLoaded:activeIndicators.length,
    observablesChecked:observables.length,
    matches,
    highestRiskScore,
    decision
  };
}

export function createThreatIntelSummary(report: ThreatIntelReport): string {
  return [
    `Threat-intelligence decision: ${report.decision}`,
    `Indicators loaded: ${report.indicatorsLoaded}`,
    `Observables checked: ${report.observablesChecked}`,
    `Matches: ${report.matches.length}`,
    `Highest risk score: ${report.highestRiskScore}/100`
  ].join("\n");
}
