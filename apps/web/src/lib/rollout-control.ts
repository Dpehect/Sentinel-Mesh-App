import path from "node:path";
import {
  AtomicJsonRolloutStore,
  RolloutControlPlane
} from "@sentinel/rollout-control-plane";

const dataFile =
  process.env.SENTINEL_ROLLOUT_DATA_FILE ??
  path.join(process.cwd(), ".sentinel-data", "rollouts.json");

const globalKey = "__sentinelRolloutControlPlane";

type GlobalWithControlPlane = typeof globalThis & {
  [globalKey]?: RolloutControlPlane;
};

const globalState = globalThis as GlobalWithControlPlane;

export const rolloutControlPlane =
  globalState[globalKey] ??
  new RolloutControlPlane(
    new AtomicJsonRolloutStore(dataFile)
  );

if (process.env.NODE_ENV !== "production") {
  globalState[globalKey] = rolloutControlPlane;
}

export async function ensureDemoRollout(): Promise<void> {
  const existing = await rolloutControlPlane.list();
  if (existing.length > 0) return;

  await rolloutControlPlane.create({
    rolloutId: "sentinel-production-canary",
    operation: "agent-update",
    activeWave: null,
    createdBy: "local-admin",
    approvalRequired: true,
    waves: [
      {
        wave: 1,
        plannedAgents: 3,
        succeededAgents: 0,
        failedAgents: 0,
        skippedAgents: 0,
        state: "pending"
      },
      {
        wave: 2,
        plannedAgents: 12,
        succeededAgents: 0,
        failedAgents: 0,
        skippedAgents: 0,
        state: "pending"
      }
    ],
    metadata: {
      environment: "production",
      strategy: "canary"
    }
  });
}
