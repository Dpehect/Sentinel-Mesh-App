import{describe,expect,it}from"vitest";
import{
  applyTrustStoreTransition,
  planKeyRotation,
  validateTrustStore
}from"./index.js";

const policy={
  maximumKeyAgeDays:90,
  overlapWindowHours:24,
  minimumTrustedKeys:1,
  allowedAlgorithms:["ed25519","ecdsa"] as const
};

describe("agent key rotation",()=>{
  it("plans normal rotation for aged keys",()=>{
    const plan=planKeyRotation([
      {
        id:"old",tenantId:"org-1",purpose:"command",
        publicKeyFingerprint:"a".repeat(64),
        algorithm:"ed25519",createdAt:"2026-01-01T00:00:00.000Z",
        activatesAt:"2026-01-01T00:00:00.000Z",status:"active"
      },
      {
        id:"new",tenantId:"org-1",purpose:"command",
        publicKeyFingerprint:"b".repeat(64),
        algorithm:"ed25519",createdAt:"2026-07-19T00:00:00.000Z",
        activatesAt:"2026-07-20T00:00:00.000Z",status:"staged"
      }
    ],"command",{
      ...policy,
      allowedAlgorithms:[...policy.allowedAlgorithms]
    },new Date("2026-07-20T00:00:00.000Z"));

    expect(plan.decision).toBe("rotate");
    expect(plan.retireKeyIds).toEqual(["old"]);
  });

  it("forces emergency rotation for compromised keys",()=>{
    const plan=planKeyRotation([{
      id:"bad",tenantId:"org-1",purpose:"update",
      publicKeyFingerprint:"a".repeat(64),
      algorithm:"ed25519",createdAt:"2026-07-01T00:00:00.000Z",
      activatesAt:"2026-07-01T00:00:00.000Z",
      status:"active",compromised:true
    }],"update",{
      ...policy,
      allowedAlgorithms:[...policy.allowedAlgorithms]
    },new Date("2026-07-20T00:00:00.000Z"));

    expect(plan.decision).toBe("emergency-rotate");
    expect(plan.revokeKeyIds).toEqual(["bad"]);
  });

  it("applies staged trust-store transitions",()=>{
    const result=applyTrustStoreTransition({
      tenantId:"org-1",
      trustedKeyIds:["old"],
      revokedKeyIds:[],
      version:1
    },[
      {
        id:"old",tenantId:"org-1",purpose:"command",
        publicKeyFingerprint:"a".repeat(64),
        algorithm:"ed25519",createdAt:"2026-01-01T00:00:00.000Z",
        activatesAt:"2026-01-01T00:00:00.000Z",
        retiresAt:"2026-07-20T00:00:00.000Z",status:"retiring"
      },
      {
        id:"new",tenantId:"org-1",purpose:"command",
        publicKeyFingerprint:"b".repeat(64),
        algorithm:"ed25519",createdAt:"2026-07-19T00:00:00.000Z",
        activatesAt:"2026-07-20T00:00:00.000Z",status:"staged"
      }
    ],{
      purpose:"command",
      currentKeyIds:["old"],
      stagedKeyIds:["new"],
      retireKeyIds:["old"],
      revokeKeyIds:[],
      findings:[],
      decision:"rotate"
    },new Date("2026-07-20T01:00:00.000Z"));

    expect(result.nextStore.trustedKeyIds).toEqual(["new"]);
    expect(result.nextStore.version).toBe(2);
  });

  it("detects invalid trust stores",()=>{
    expect(validateTrustStore({
      tenantId:"org-1",
      trustedKeyIds:["missing"],
      revokedKeyIds:["missing"],
      version:1
    },[],1)).toContain("missing:UNKNOWN_TRUST_KEY");
  });
});
