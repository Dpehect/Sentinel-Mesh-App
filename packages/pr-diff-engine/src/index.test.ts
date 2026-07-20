import {describe, expect, it} from "vitest";
import {analyzePullRequestDiff, createPullRequestSummary} from "./index.js";

const path = (id:string, score:number) => ({
  id,
  nodes:[],
  edges:[],
  evidence:[],
  score,
  blockedBy:[]
});

describe("pr diff engine", () => {
  it("blocks a newly introduced critical attack path", () => {
    const result = analyzePullRequestDiff(
      [{path:"src/api.ts", status:"modified", additions:10, deletions:2}],
      [],
      [path("path-critical", 92)]
    );

    expect(result.decision).toBe("block");
    expect(result.addedPaths).toHaveLength(1);
  });

  it("creates a compact merge summary", () => {
    const result = analyzePullRequestDiff([], [path("old", 40)], []);
    expect(createPullRequestSummary(result)).toContain("Security decision:");
  });
});
