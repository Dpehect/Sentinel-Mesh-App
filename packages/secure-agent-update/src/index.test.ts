import{describe,expect,it}from"vitest";
import{
  evaluateAgentUpdate,
  evaluateRollout,
  validateUpdateManifest,
  verifyArtifactChecksum
}from"./index.js";

const manifest={
  version:"2.0.0",
  platform:"linux",
  artifactSha256:"a".repeat(64),
  signature:"s".repeat(64),
  signerId:"release-key-1",
  publishedAt:"2026-07-20T10:00:00.000Z",
  minimumCurrentVersion:"1.0.0",
  rolloutPercent:25
};

describe("secure agent update",()=>{
  it("validates signed manifests",()=>{
    expect(validateUpdateManifest(manifest,["release-key-1"])).toEqual([]);
  });

  it("uses deterministic staged rollout buckets",()=>{
    expect(evaluateAgentUpdate({
      id:"a1",platform:"linux",version:"1.5.0",tenantId:"org-1",
      stableBucket:10,status:"healthy"
    },manifest).eligible).toBe(true);

    expect(evaluateAgentUpdate({
      id:"a2",platform:"linux",version:"1.5.0",tenantId:"org-1",
      stableBucket:80,status:"healthy"
    },manifest).reason).toBe("OUTSIDE_ROLLOUT_BUCKET");
  });

  it("rolls back failed health checks",()=>{
    const report=evaluateRollout([{
      id:"a1",platform:"linux",version:"1.5.0",tenantId:"org-1",
      stableBucket:10,status:"healthy"
    }],manifest,[{
      agentId:"a1",fromVersion:"1.5.0",toVersion:"2.0.0",
      success:true,healthCheckPassed:false,
      attemptedAt:"2026-07-20T10:10:00.000Z"
    }]);

    expect(report.decision).toBe("rollback");
    expect(report.rollbackAgents).toEqual(["a1"]);
  });

  it("verifies artifact checksums",()=>{
    expect(verifyArtifactChecksum("ABC","abc")).toBe(true);
  });
});
