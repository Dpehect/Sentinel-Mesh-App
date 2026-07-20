import path from "node:path";
import {
  AtomicJsonOperationsStore,
  OperationsCenter
} from "@sentinel/operations-center";

const dataFile =
  process.env.SENTINEL_OPERATIONS_DATA_FILE ??
  path.join(process.cwd(), ".sentinel-data", "operations.json");

const key = "__sentinelOperationsCenter";

type GlobalWithOperations = typeof globalThis & {
  [key]?: OperationsCenter;
};

const globalState = globalThis as GlobalWithOperations;

export const operationsCenter =
  globalState[key] ??
  new OperationsCenter(new AtomicJsonOperationsStore(dataFile));

if (process.env.NODE_ENV !== "production") {
  globalState[key] = operationsCenter;
}

export async function ensureOperationsDemo(): Promise<void> {
  const snapshot = await operationsCenter.overview();

  if (snapshot.members.length === 0) {
    await operationsCenter.addMember("owner", {
      email: "owner@sentinel.local",
      displayName: "Local Owner",
      role: "owner",
      active: true
    });
  }

  if (snapshot.incidents.length === 0) {
    await operationsCenter.createIncident("analyst", {
      title: "Critical rollout integrity alert",
      severity: "critical",
      status: "investigating",
      source: "rollout-audit-chain",
      description:
        "A rollout event chain requires security review before continuation.",
      tags: ["rollout", "integrity", "production"]
    });

    await operationsCenter.createIncident("analyst", {
      title: "Worker queue latency increased",
      severity: "medium",
      status: "open",
      source: "worker",
      description:
        "Queue processing latency is above the local operating baseline.",
      tags: ["worker", "queue"]
    });
  }

  if (snapshot.rules.length === 0) {
    await operationsCenter.createRule("security-admin", {
      name: "High severity operations alert",
      enabled: true,
      severities: ["critical", "high"],
      channels: ["in-app", "email"],
      cooldownMinutes: 15
    });
  }

  if (snapshot.health.length === 0) {
    await operationsCenter.recordHealth("operator", {
      component: "web",
      status: "healthy",
      latencyMs: 42,
      checkedAt: new Date().toISOString(),
      details: "Next.js control plane"
    });

    await operationsCenter.recordHealth("operator", {
      component: "worker",
      status: "degraded",
      latencyMs: 680,
      checkedAt: new Date().toISOString(),
      details: "Queue latency above baseline"
    });

    await operationsCenter.recordHealth("operator", {
      component: "rollout-store",
      status: "healthy",
      latencyMs: 18,
      checkedAt: new Date().toISOString(),
      details: "Atomic local persistence"
    });
  }
}
