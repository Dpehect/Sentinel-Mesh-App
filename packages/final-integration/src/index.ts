import type {
  FinalCheck,
  FinalProductStatus,
  RepositoryLayoutInput,
  RepositoryLayoutReport
} from "./types.js";

export type {
  FinalCheck,
  FinalCheckStatus,
  FinalProductStatus,
  RepositoryLayoutInput,
  RepositoryLayoutReport
} from "./types.js";

const requiredPackages = [
  "@sentinel/agent-fleet-orchestration",
  "@sentinel/agent-fleet-rollout",
  "@sentinel/agent-rollout-audit-chain",
  "@sentinel/rollout-control-plane",
  "@sentinel/operations-center",
  "@sentinel/release-readiness"
];

const requiredRoutes = [
  "/dashboard",
  "/findings",
  "/attack-paths",
  "/rollouts",
  "/operations",
  "/team",
  "/system",
  "/backups"
];

export function inspectRepositoryLayout(
  input: RepositoryLayoutInput
): RepositoryLayoutReport {
  const packageSet = new Set(input.packageNames);
  const routeSet = new Set(input.webRoutes);
  const rootSet = new Set(input.rootFiles);
  const directorySet = new Set(input.directories);

  const missingPackages = requiredPackages.filter(
    item => !packageSet.has(item)
  );
  const missingRoutes = requiredRoutes.filter(
    item => !routeSet.has(item)
  );

  const legacyDemoDetected =
    directorySet.has("app") &&
    directorySet.has("data") &&
    (
      rootSet.has("START-MAC.command") ||
      rootSet.has("START-WINDOWS.bat")
    );

  const checks: FinalCheck[] = [
    {
      id: "accelerated-packages",
      label: "Accelerated production packages",
      status: missingPackages.length === 0 ? "pass" : "fail",
      category: "source",
      blocking: true,
      message: missingPackages.length === 0
        ? "All production packages are installed"
        : `Missing packages: ${missingPackages.join(", ")}`
    },
    {
      id: "console-routes",
      label: "Console routes",
      status: missingRoutes.length === 0 ? "pass" : "fail",
      category: "operations",
      blocking: true,
      message: missingRoutes.length === 0
        ? "All required console routes are available"
        : `Missing routes: ${missingRoutes.join(", ")}`
    },
    {
      id: "legacy-static-demo",
      label: "Legacy static demo isolation",
      status: legacyDemoDetected ? "warn" : "pass",
      category: "source",
      blocking: false,
      message: legacyDemoDetected
        ? "Legacy root-level static demo should be archived"
        : "No active root-level static demo detected"
    }
  ];

  return {
    checks,
    legacyDemoDetected,
    requiredRoutesPresent: missingRoutes.length === 0,
    requiredPackagesPresent: missingPackages.length === 0
  };
}

export function buildFinalProductStatus(
  version: string,
  checks: FinalCheck[],
  capabilities: string[],
  now = new Date()
): FinalProductStatus {
  const blockingFailures = checks.filter(
    check => check.blocking && check.status === "fail"
  );

  const weight: Record<FinalCheck["status"], number> = {
    pass: 1,
    warn: 0.5,
    fail: 0
  };

  const score = checks.length === 0
    ? 0
    : Math.round(
        checks.reduce(
          (sum, check) => sum + weight[check.status],
          0
        ) / checks.length * 100
      );

  const remainingActions = checks
    .filter(check => check.status !== "pass")
    .map(check => check.message);

  return {
    version,
    ready: blockingFailures.length === 0,
    score,
    generatedAt: now.toISOString(),
    checks,
    capabilities: [...new Set(capabilities)].sort(),
    remainingActions
  };
}

export function finalCapabilityCatalog(): string[] {
  return [
    "AI-assisted security intelligence",
    "Attack-path analysis",
    "Audit-chain integrity",
    "Backup and safe restore",
    "Compliance evidence",
    "Distributed agent lifecycle",
    "Fleet canary orchestration",
    "GitHub-native security checks",
    "Incident operations center",
    "Local-first scanning",
    "Multi-tenant enterprise controls",
    "Production readiness gates",
    "Recovery checkpoints",
    "Role-based operations access",
    "Rollout approval workflow",
    "Runtime and platform diagnostics",
    "Security finding lifecycle",
    "Signed agent telemetry",
    "Supply-chain scanning"
  ];
}

export function mergeChecks(
  ...groups: FinalCheck[][]
): FinalCheck[] {
  const byId = new Map<string, FinalCheck>();
  for (const group of groups) {
    for (const check of group) byId.set(check.id, check);
  }
  return [...byId.values()];
}
