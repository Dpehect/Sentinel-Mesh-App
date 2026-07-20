import type {AttackPath} from "@sentinel/attack-path-engine";

export interface PullRequestFileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
}

export interface PullRequestSecurityDiff {
  changedFiles: PullRequestFileChange[];
  addedPaths: AttackPath[];
  removedPaths: AttackPath[];
  changedPaths: Array<{
    before: AttackPath;
    after: AttackPath;
    scoreDelta: number;
  }>;
  regressionScore: number;
  decision: "allow" | "warn" | "block";
}
