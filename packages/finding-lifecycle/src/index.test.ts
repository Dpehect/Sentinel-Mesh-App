import {describe, expect, it} from "vitest";
import {
  calculateDueAt,
  isFindingOverdue,
  transitionFinding
} from "./index.js";

describe("finding lifecycle", () => {
  it("requires justification for risk acceptance", () => {
    const finding = {
      id:"finding-1",
      severity:"critical" as const,
      status:"open" as const,
      updatedAt:"2026-07-20T00:00:00.000Z"
    };

    expect(() => transitionFinding(finding, {
      from:"open",
      to:"risk-accepted",
      actorId:"user-1",
      occurredAt:"2026-07-20T01:00:00.000Z"
    })).toThrow("JUSTIFICATION_REQUIRED");
  });

  it("calculates critical SLA and overdue state", () => {
    const dueAt = calculateDueAt("critical", "2026-07-20T00:00:00.000Z");

    expect(dueAt).toBe("2026-07-21T00:00:00.000Z");
    expect(isFindingOverdue({
      id:"finding-2",
      severity:"critical",
      status:"open",
      dueAt,
      updatedAt:"2026-07-20T00:00:00.000Z"
    }, new Date("2026-07-22T00:00:00.000Z"))).toBe(true);
  });
});
