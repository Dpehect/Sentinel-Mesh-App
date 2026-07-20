import{describe,expect,it}from"vitest";
import{
  detectPolicyDrift,
  evaluatePolicyDistribution,
  evaluatePolicyTarget,
  validatePolicyBundle
}from"./index.js";

const bundle={
  id:"policy-1",
  tenantId:"org-1",
  version:"3.0.0",
  checksumSha256:"a".repeat(64),
  signature:"s".repeat(64),
  signerId:"policy-key-1",
  publishedAt:"2026-07-20T10:00:00.000Z",
  targetPlatforms:["linux"],
  targetTags:["production"],
  settings:{scanIntervalSeconds:60}
};

describe("agent policy distribution",()=>{
  it("validates signed policy bundles",()=>{
    expect(validatePolicyBundle(bundle,["policy-key-1"])).toEqual([]);
  });

  it("targets tenant, platform and tags",()=>{
    expect(evaluatePolicyTarget({
      id:"a1",tenantId:"org-1",platform:"linux",
      tags:["production"],status:"active"
    },bundle).eligible).toBe(true);
  });

  it("detects policy checksum drift",()=>{
    const drift=detectPolicyDrift([{
      id:"a1",tenantId:"org-1",platform:"linux",
      tags:["production"],status:"active",
      currentPolicyVersion:"3.0.0",
      currentPolicyChecksum:"b".repeat(64)
    }],bundle);

    expect(drift).toEqual(["a1"]);
  });

  it("rolls back failed health checks",()=>{
    const report=evaluatePolicyDistribution([{
      id:"a1",tenantId:"org-1",platform:"linux",
      tags:["production"],status:"active"
    }],bundle,[{
      agentId:"a1",policyId:"policy-1",version:"3.0.0",
      applied:true,healthCheckPassed:false,
      appliedAt:"2026-07-20T10:10:00.000Z"
    }]);

    expect(report.decision).toBe("rollback");
    expect(report.rollbackAgents).toEqual(["a1"]);
  });
});
