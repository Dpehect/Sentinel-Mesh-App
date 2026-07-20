import{describe,expect,it}from"vitest";
import{
  computeEnvelopeHash,
  verifyTelemetryBatch
}from"./index.js";

function envelope(sequence:number,previousEnvelopeHash?:string){
  const base={
    id:`e${sequence}`,
    tenantId:"org-1",
    agentId:"agent-1",
    sequence,
    timestamp:"2026-07-20T10:00:00.000Z",
    payloadHash:"a".repeat(64),
    previousEnvelopeHash,
    nonce:`nonce-${sequence}`
  };
  return{...base,envelopeHash:computeEnvelopeHash(base)};
}

describe("agent telemetry integrity",()=>{
  it("accepts a valid hash chain",()=>{
    const first=envelope(1);
    const second=envelope(2,first.envelopeHash);

    const report=verifyTelemetryBatch({
      tenantId:"org-1",
      agentId:"agent-1",
      lastSequence:0,
      seenNonces:[]
    },[first,second],{
      maxClockSkewSeconds:60,
      maxSequenceGap:2
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(report.decision).toBe("accept");
    expect(report.acceptedEnvelopeIds).toEqual(["e1","e2"]);
  });

  it("rejects nonce replay",()=>{
    const first=envelope(1);

    const report=verifyTelemetryBatch({
      tenantId:"org-1",
      agentId:"agent-1",
      lastSequence:0,
      seenNonces:["nonce-1"]
    },[first],{
      maxClockSkewSeconds:60,
      maxSequenceGap:2
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(report.decision).toBe("reject");
    expect(report.findings.some(item=>item.code==="NONCE_REPLAY")).toBe(true);
  });

  it("rejects a broken hash chain",()=>{
    const second=envelope(2,"wrong");

    const report=verifyTelemetryBatch({
      tenantId:"org-1",
      agentId:"agent-1",
      lastSequence:1,
      lastEnvelopeHash:"expected",
      seenNonces:[]
    },[second],{
      maxClockSkewSeconds:60,
      maxSequenceGap:2
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(report.findings.some(item=>item.code==="HASH_CHAIN_BROKEN")).toBe(true);
  });
});
