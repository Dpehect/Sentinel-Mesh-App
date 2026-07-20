import {describe, expect, it} from "vitest";
import {
  classifyIncident,
  evaluateIncidentSla,
  transitionIncident
} from "./index.js";

describe("incident response", () => {
  it("classifies confirmed data exposure as sev-1", () => {
    expect(classifyIncident(0, true, false)).toBe("sev-1");
  });

  it("enforces incident state transitions", () => {
    const incident = {
      id:"incident-1",
      tenantId:"org-1",
      title:"Unauthorized access",
      severity:"sev-2" as const,
      status:"declared" as const,
      declaredAt:"2026-07-20T00:00:00.000Z"
    };

    expect(transitionIncident(incident, "investigating").status).toBe("investigating");
    expect(() => transitionIncident(incident, "closed")).toThrow("INVALID_INCIDENT_TRANSITION");
  });

  it("detects overdue sev-1 response actions", () => {
    const result = evaluateIncidentSla({
      id:"incident-2",
      tenantId:"org-1",
      title:"Production compromise",
      severity:"sev-1",
      status:"investigating",
      declaredAt:"2026-07-20T00:00:00.000Z"
    }, new Date("2026-07-20T05:00:00.000Z"));

    expect(result.overdueActions).toContain("ACKNOWLEDGEMENT_OVERDUE");
    expect(result.overdueActions).toContain("CONTAINMENT_OVERDUE");
  });
});
