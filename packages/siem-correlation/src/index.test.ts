import {describe, expect, it} from "vitest";
import {
  correlateSecurityEvents,
  createCorrelationSummary
} from "./index.js";

const rule = {
  id:"SIEM-001",
  name:"Credential compromise followed by privileged activity",
  eventTypes:["failed-login","successful-login","privileged-action"],
  minimumMatches:3,
  windowMinutes:15,
  groupBy:"entityId" as const,
  severity:"critical" as const,
  requiredSources:["identity","audit"]
};

describe("SIEM correlation", () => {
  it("correlates multi-source attack sequences", () => {
    const report = correlateSecurityEvents([
      {
        id:"e1", tenantId:"org-1",
        timestamp:"2026-07-20T10:00:00.000Z",
        source:"identity", type:"failed-login", severity:"medium",
        entityId:"user-1"
      },
      {
        id:"e2", tenantId:"org-1",
        timestamp:"2026-07-20T10:04:00.000Z",
        source:"identity", type:"successful-login", severity:"high",
        entityId:"user-1"
      },
      {
        id:"e3", tenantId:"org-1",
        timestamp:"2026-07-20T10:08:00.000Z",
        source:"audit", type:"privileged-action", severity:"critical",
        entityId:"user-1"
      }
    ], [rule]);

    expect(report.incidents).toHaveLength(1);
    expect(report.decision).toBe("escalate");
    expect(report.incidents[0].sources).toEqual(["identity","audit"]);
  });

  it("does not correlate events outside the window", () => {
    const report = correlateSecurityEvents([
      {
        id:"e1", tenantId:"org-1",
        timestamp:"2026-07-20T10:00:00.000Z",
        source:"identity", type:"failed-login", severity:"medium",
        entityId:"user-1"
      },
      {
        id:"e2", tenantId:"org-1",
        timestamp:"2026-07-20T11:00:00.000Z",
        source:"identity", type:"successful-login", severity:"high",
        entityId:"user-1"
      },
      {
        id:"e3", tenantId:"org-1",
        timestamp:"2026-07-20T11:02:00.000Z",
        source:"audit", type:"privileged-action", severity:"critical",
        entityId:"user-1"
      }
    ], [rule]);

    expect(report.incidents).toHaveLength(0);
    expect(report.decision).toBe("allow");
  });

  it("creates a compact summary", () => {
    expect(createCorrelationSummary(
      correlateSecurityEvents([], [])
    )).toContain("SIEM decision:");
  });
});
