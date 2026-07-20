import {describe, expect, it} from "vitest";
import {evaluatePolicy, resolveMergeDecision} from "./index.js";

const attackPath = {
  id:"path_critical",
  nodes:[],
  edges:[],
  evidence:[],
  score:92,
  blockedBy:[]
};

describe("policy engine", () => {
  it("blocks critical unmitigated paths on main", () => {
    const result = evaluatePolicy({
      id:"critical-main",
      name:"Block critical paths",
      enabled:true,
      minimumScore:80,
      action:"block",
      requireUnblockedPath:true,
      appliesToBranches:["main"]
    }, {
      branch:"main",
      attackPaths:[attackPath]
    });

    expect(result.matched).toBe(true);
    expect(resolveMergeDecision([result])).toBe("block");
  });

  it("ignores policies outside matching branches", () => {
    const result = evaluatePolicy({
      id:"release-only",
      name:"Release policy",
      enabled:true,
      minimumScore:50,
      action:"block",
      appliesToBranches:["release/*"]
    }, {
      branch:"feature/test",
      attackPaths:[attackPath]
    });

    expect(result.matched).toBe(false);
    expect(resolveMergeDecision([result])).toBe("allow");
  });
});
