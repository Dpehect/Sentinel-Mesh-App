import {describe, expect, it} from "vitest";
import {
  createIndicator,
  importStixIndicators,
  matchThreatIntelligence
} from "./index.js";

describe("threat intelligence", () => {
  it("matches normalized domain indicators", () => {
    const indicator = createIndicator({
      type:"domain",
      value:"Malicious.Example",
      severity:"high",
      confidence:90,
      source:"local",
      labels:["phishing"]
    });

    const report = matchThreatIntelligence([indicator], [{
      type:"domain",
      value:"malicious.example",
      observedAt:"2026-07-20T00:00:00.000Z"
    }]);

    expect(report.matches).toHaveLength(1);
    expect(report.decision).toBe("block");
  });

  it("imports supported STIX-like patterns", () => {
    const indicators = importStixIndicators([{
      type:"indicator",
      id:"indicator--1",
      pattern:"[ipv4-addr:value = '203.0.113.10']",
      confidence:85,
      labels:["high","command-and-control"]
    }]);

    expect(indicators).toHaveLength(1);
    expect(indicators[0].type).toBe("ipv4");
  });

  it("ignores expired indicators", () => {
    const indicator = createIndicator({
      type:"sha256",
      value:"a".repeat(64),
      severity:"critical",
      confidence:100,
      source:"local",
      labels:["malware"],
      expiresAt:"2026-01-01T00:00:00.000Z"
    });

    const report = matchThreatIntelligence([indicator], [{
      type:"sha256",
      value:"a".repeat(64),
      observedAt:"2026-07-20T00:00:00.000Z"
    }], new Date("2026-07-20T00:00:00.000Z"));

    expect(report.matches).toHaveLength(0);
    expect(report.decision).toBe("allow");
  });
});
