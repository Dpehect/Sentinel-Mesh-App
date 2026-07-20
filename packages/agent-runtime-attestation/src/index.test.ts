import{describe,expect,it}from"vitest";
import{evaluateRuntimeAttestation}from"./index.js";

const baseline={
  tenantId:"org-1",
  agentId:"agent-1",
  platform:"linux",
  approvedBinaryHashes:["bin-ok"],
  approvedModuleHashes:["mod-a","mod-b"],
  secureBootRequired:true,
  tpmRequired:true,
  minimumAgentVersion:"2.0.0"
};

const state={
  tenantId:"org-1",
  agentId:"agent-1",
  usedNonces:[]
};

const policy={
  trustedSigners:["attest-key-1"],
  maxLifetimeSeconds:300,
  maximumUnknownModules:0
};

const attestation={
  tenantId:"org-1",
  agentId:"agent-1",
  platform:"linux",
  agentVersion:"2.1.0",
  binaryHash:"bin-ok",
  loadedModuleHashes:["mod-a","mod-b"],
  secureBootEnabled:true,
  tpmPresent:true,
  nonce:"nonce-1",
  issuedAt:"2026-07-20T10:00:00.000Z",
  expiresAt:"2026-07-20T10:05:00.000Z",
  signerId:"attest-key-1",
  signature:"s".repeat(64)
};

describe("agent runtime attestation",()=>{
  it("trusts valid runtime measurements",()=>{
    const report=evaluateRuntimeAttestation(
      baseline,state,attestation,policy,
      new Date("2026-07-20T10:01:00.000Z")
    );

    expect(report.decision).toBe("trust");
    expect(report.trusted).toBe(true);
  });

  it("quarantines unapproved binaries",()=>{
    const report=evaluateRuntimeAttestation(
      baseline,state,{...attestation,binaryHash:"tampered"},policy,
      new Date("2026-07-20T10:01:00.000Z")
    );

    expect(report.decision).toBe("quarantine");
    expect(report.findings).toContain("UNAPPROVED_AGENT_BINARY");
  });

  it("rejects nonce replay",()=>{
    const report=evaluateRuntimeAttestation(
      baseline,{...state,usedNonces:["nonce-1"]},attestation,policy,
      new Date("2026-07-20T10:01:00.000Z")
    );

    expect(report.decision).toBe("reject");
    expect(report.findings).toContain("NONCE_REPLAY");
  });

  it("detects unknown loaded modules",()=>{
    const report=evaluateRuntimeAttestation(
      baseline,state,{...attestation,loadedModuleHashes:["mod-a","unknown"]},policy,
      new Date("2026-07-20T10:01:00.000Z")
    );

    expect(report.decision).toBe("quarantine");
    expect(report.unknownModules).toEqual(["unknown"]);
  });
});
