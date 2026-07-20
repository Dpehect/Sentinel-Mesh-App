import {describe, expect, it} from "vitest";
import {calculateEvidenceRisk, createEvidence} from "./index.js";

describe("evidence engine", () => {
  it("creates deterministic evidence fingerprints", () => {
    const input = {
      title: "SQL injection",
      severity: "critical" as const,
      confidence: 0.92,
      cwe: ["CWE-89"],
      owasp: ["A03:2021"],
      source: {path: "api.ts", line: 12},
      sink: {path: "db.ts", line: 44},
      remediation: "Use parameterized queries."
    };

    expect(createEvidence(input).fingerprint).toBe(createEvidence(input).fingerprint);
  });

  it("calculates bounded risk", () => {
    const evidence = createEvidence({
      title: "Unsafe sink",
      severity: "high",
      confidence: 0.8,
      remediation: "Validate input."
    });

    expect(calculateEvidenceRisk(evidence)).toBeGreaterThan(0);
    expect(calculateEvidenceRisk(evidence)).toBeLessThanOrEqual(100);
  });
});
