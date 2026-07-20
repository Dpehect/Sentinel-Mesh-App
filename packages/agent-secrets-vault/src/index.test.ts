import{describe,expect,it}from"vitest";
import{
  authorizeSecretLease,
  detectPlaintextSecret,
  evaluateSecretVault
}from"./index.js";

const secret={
  id:"secret-1",tenantId:"org-1",name:"integration-token",
  purpose:"integration" as const,ciphertext:"enc:abcdef",keyId:"key-1",
  version:1,createdAt:"2026-07-01T00:00:00.000Z",
  status:"active" as const,allowedAgentIds:["agent-1"]
};

const policy={
  maximumLeaseSeconds:300,
  maximumSecretAgeDays:90,
  allowedKeyIds:["key-1"]
};

describe("agent secrets vault",()=>{
  it("issues short-lived tenant-scoped leases",()=>{
    const result=authorizeSecretLease(secret,{
      tenantId:"org-1",agentId:"agent-1",secretId:"secret-1",
      requestedAt:"2026-07-20T10:00:00.000Z",
      leaseSeconds:120,nonce:"nonce-1"
    },policy,[],new Date("2026-07-20T10:00:00.000Z"));

    expect(result.allowed).toBe(true);
    expect(result.lease?.secretVersion).toBe(1);
  });

  it("blocks unauthorized agents",()=>{
    const result=authorizeSecretLease(secret,{
      tenantId:"org-1",agentId:"agent-2",secretId:"secret-1",
      requestedAt:"2026-07-20T10:00:00.000Z",
      leaseSeconds:120,nonce:"nonce-1"
    },policy,[]);

    expect(result.reason).toBe("AGENT_NOT_AUTHORIZED");
  });

  it("detects invalid encrypted storage",()=>{
    const report=evaluateSecretVault([
      {...secret,ciphertext:"plaintext",keyId:"unknown"}
    ],policy,new Date("2026-07-20T00:00:00.000Z"));

    expect(report.decision).toBe("block");
    expect(report.invalidEncryptionSecretIds).toEqual(["secret-1"]);
  });

  it("detects plaintext secret patterns",()=>{
    expect(detectPlaintextSecret("api_key=abcdefghijklmnop")).toBe(true);
    expect(detectPlaintextSecret("enc:abcdefghijklmnop")).toBe(false);
  });
});
