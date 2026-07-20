import { describe, expect, it } from "vitest";
import {
  MemoryOperationsStore,
  OperationsCenter,
  roleCan
} from "./index.js";

describe("operations center", () => {
  it("enforces role permissions", () => {
    expect(roleCan("owner", "member:create")).toBe(true);
    expect(roleCan("viewer", "member:create")).toBe(false);
  });

  it("creates and transitions incidents with version guards", async () => {
    const center = new OperationsCenter(new MemoryOperationsStore());

    const incident = await center.createIncident("analyst", {
      title: "Agent telemetry integrity failure",
      severity: "critical",
      status: "open",
      source: "agent-1",
      description: "Signed telemetry sequence failed validation",
      tags: ["agent", "integrity"]
    });

    const updated = await center.transitionIncident(
      "analyst",
      incident.incidentId,
      "investigating",
      incident.version
    );

    expect(updated.status).toBe("investigating");

    await expect(
      center.transitionIncident(
        "analyst",
        incident.incidentId,
        "resolved",
        incident.version
      )
    ).rejects.toThrow("Version conflict");
  });

  it("derives notifications from active rules", async () => {
    const center = new OperationsCenter(new MemoryOperationsStore());

    const incident = await center.createIncident("analyst", {
      title: "Critical rollout failure",
      severity: "critical",
      status: "open",
      source: "rollout-control",
      description: "Canary failure threshold exceeded",
      tags: ["rollout"]
    });

    await center.createRule("security-admin", {
      name: "Critical incident alert",
      enabled: true,
      severities: ["critical"],
      channels: ["in-app", "email"],
      cooldownMinutes: 10
    });

    const notifications = await center.deriveNotifications();
    expect(notifications[0]?.incidentId).toBe(incident.incidentId);
  });

  it("summarizes component health", async () => {
    const center = new OperationsCenter(new MemoryOperationsStore());

    await center.recordHealth("operator", {
      component: "worker",
      status: "degraded",
      latencyMs: 780,
      checkedAt: new Date().toISOString()
    });

    const summary = await center.healthSummary();
    expect(summary.overall).toBe("degraded");
  });
});
