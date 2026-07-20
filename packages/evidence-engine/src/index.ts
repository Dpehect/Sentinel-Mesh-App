import {createHash} from "node:crypto";
import type {SecurityEvidence, SourceLocation, DataFlowStep, Severity} from "./types.js";

export type {SecurityEvidence, SourceLocation, DataFlowStep, Severity};

export interface EvidenceInput {
  title: string;
  severity: Severity;
  confidence: number;
  cwe?: string[];
  owasp?: string[];
  source?: SourceLocation;
  sink?: SourceLocation;
  flow?: DataFlowStep[];
  remediation: string;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function createEvidence(input: EvidenceInput): SecurityEvidence {
  const normalized = [
    input.title,
    input.source?.path ?? "",
    input.source?.line ?? "",
    input.sink?.path ?? "",
    input.sink?.line ?? "",
    ...(input.cwe ?? [])
  ].join("|");

  const fingerprint = createHash("sha256").update(normalized).digest("hex");

  return {
    id: `evidence_${fingerprint.slice(0, 16)}`,
    title: input.title.trim(),
    severity: input.severity,
    confidence: clamp(input.confidence),
    cwe: [...new Set(input.cwe ?? [])],
    owasp: [...new Set(input.owasp ?? [])],
    source: input.source,
    sink: input.sink,
    flow: input.flow ?? [],
    remediation: input.remediation.trim(),
    fingerprint
  };
}

export function calculateEvidenceRisk(evidence: SecurityEvidence): number {
  const severityWeight: Record<Severity, number> = {
    critical: 100,
    high: 80,
    medium: 55,
    low: 25,
    info: 5
  };

  const flowBonus = Math.min(evidence.flow.length * 2, 10);
  return Math.round(Math.min(100, severityWeight[evidence.severity] * evidence.confidence + flowBonus));
}
