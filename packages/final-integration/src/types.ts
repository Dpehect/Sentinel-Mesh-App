export type FinalCheckStatus = "pass" | "warn" | "fail";

export interface FinalCheck {
  id: string;
  label: string;
  status: FinalCheckStatus;
  category:
    | "source"
    | "runtime"
    | "security"
    | "operations"
    | "release";
  message: string;
  blocking: boolean;
}

export interface FinalProductStatus {
  version: string;
  ready: boolean;
  score: number;
  generatedAt: string;
  checks: FinalCheck[];
  capabilities: string[];
  remainingActions: string[];
}

export interface RepositoryLayoutInput {
  rootFiles: string[];
  directories: string[];
  packageNames: string[];
  webRoutes: string[];
}

export interface RepositoryLayoutReport {
  checks: FinalCheck[];
  legacyDemoDetected: boolean;
  requiredRoutesPresent: boolean;
  requiredPackagesPresent: boolean;
}
