import type {AttackPath} from "@sentinel/attack-path-engine";
import type {
  PullRequestFileChange,
  PullRequestSecurityDiff
} from "./types.js";

export type {PullRequestFileChange, PullRequestSecurityDiff};

function byId(paths: AttackPath[]): Map<string, AttackPath> {
  return new Map(paths.map(path => [path.id, path]));
}

export function analyzePullRequestDiff(
  changedFiles: PullRequestFileChange[],
  beforePaths: AttackPath[],
  afterPaths: AttackPath[]
): PullRequestSecurityDiff {
  const before = byId(beforePaths);
  const after = byId(afterPaths);

  const addedPaths = afterPaths.filter(path => !before.has(path.id));
  const removedPaths = beforePaths.filter(path => !after.has(path.id));
  const changedPaths = afterPaths
    .filter(path => before.has(path.id))
    .map(path => ({
      before: before.get(path.id)!,
      after: path,
      scoreDelta: path.score - before.get(path.id)!.score
    }))
    .filter(item => item.scoreDelta !== 0);

  const newRisk = addedPaths.reduce((sum, path) => sum + path.score, 0);
  const increasedRisk = changedPaths
    .filter(item => item.scoreDelta > 0)
    .reduce((sum, item) => sum + item.scoreDelta, 0);
  const removedRisk = removedPaths.reduce((sum, path) => sum + path.score, 0);

  const regressionScore = Math.max(0, Math.min(100,
    Math.round(newRisk * 0.7 + increasedRisk * 0.3 - removedRisk * 0.2)
  ));

  const decision =
    addedPaths.some(path => path.score >= 80 && path.blockedBy.length === 0) ||
    regressionScore >= 80
      ? "block"
      : regressionScore >= 50
        ? "warn"
        : "allow";

  return {
    changedFiles,
    addedPaths,
    removedPaths,
    changedPaths,
    regressionScore,
    decision
  };
}

export function createPullRequestSummary(diff: PullRequestSecurityDiff): string {
  return [
    `Security decision: ${diff.decision.toUpperCase()}`,
    `Regression score: ${diff.regressionScore}/100`,
    `New attack paths: ${diff.addedPaths.length}`,
    `Removed attack paths: ${diff.removedPaths.length}`,
    `Changed attack paths: ${diff.changedPaths.length}`,
    `Files reviewed: ${diff.changedFiles.length}`
  ].join("\n");
}
