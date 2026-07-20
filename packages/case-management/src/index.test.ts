import {describe, expect, it} from "vitest";
import {
  addCaseTask,
  evaluateCase,
  mergeCaseEvidence,
  transitionCase
} from "./index.js";

const securityCase = {
  id:"case-1",
  tenantId:"org-1",
  title:"Credential compromise",
  severity:"critical" as const,
  status:"open" as const,
  createdAt:"2026-07-20T00:00:00.000Z",
  updatedAt:"2026-07-20T00:00:00.000Z",
  incidentIds:["incident-1"],
  findingIds:[],
  evidenceIds:["evidence-1"],
  tasks:[]
};

describe("case management", () => {
  it("enforces the case lifecycle", () => {
    expect(transitionCase(securityCase, "triage").status).toBe("triage");
    expect(() => transitionCase(securityCase, "closed"))
      .toThrow("INVALID_CASE_TRANSITION");
  });

  it("detects overdue and unassigned critical cases", () => {
    const result = evaluateCase(
      securityCase,
      new Date("2026-07-20T01:00:00.000Z")
    );

    expect(result.overdue).toBe(true);
    expect(result.unassigned).toBe(true);
    expect(result.escalationRequired).toBe(true);
  });

  it("tracks tasks and deduplicates evidence", () => {
    const withTask = addCaseTask(securityCase, {
      id:"task-1",
      title:"Revoke compromised token",
      status:"todo",
      evidenceIds:[]
    });

    expect(withTask.tasks).toHaveLength(1);

    const withEvidence = mergeCaseEvidence(withTask, [
      "evidence-1","evidence-2"
    ]);

    expect(withEvidence.evidenceIds).toEqual([
      "evidence-1","evidence-2"
    ]);
  });
});
