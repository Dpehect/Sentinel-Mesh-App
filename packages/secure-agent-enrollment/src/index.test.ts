import {describe,expect,it} from "vitest";
import {
  compareVersions,
  evaluateAgentFleet,
  validateEnrollment
} from "./index.js";

const fingerprint = "AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00";

describe("secure agent enrollment",()=>{
  it("accepts a valid one-time enrollment request",()=>{
    const decision = validateEnrollment({
      id:"token-1",
      tenantId:"org-1",
      tokenHash:"hash-1",
      createdAt:"2026-07-20T09:00:00.000Z",
      expiresAt:"2026-07-20T11:00:00.000Z",
      maxUses:1,
      uses:0,
      allowedPlatforms:["linux"],
      revoked:false
    },{
      tenantId:"org-1",
      tokenHash:"hash-1",
      agentId:"agent-1",
      platform:"linux",
      version:"1.4.0",
      certificateFingerprint:fingerprint,
      requestedAt:"2026-07-20T10:00:00.000Z"
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(decision.allowed).toBe(true);
    expect(decision.agent?.status).toBe("active");
  });

  it("rejects expired enrollment tokens",()=>{
    const decision = validateEnrollment({
      id:"token-1",
      tenantId:"org-1",
      tokenHash:"hash-1",
      createdAt:"2026-07-20T08:00:00.000Z",
      expiresAt:"2026-07-20T09:00:00.000Z",
      maxUses:1,
      uses:0,
      allowedPlatforms:[],
      revoked:false
    },{
      tenantId:"org-1",
      tokenHash:"hash-1",
      agentId:"agent-1",
      platform:"linux",
      version:"1.0.0",
      certificateFingerprint:fingerprint,
      requestedAt:"2026-07-20T10:00:00.000Z"
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(decision.reason).toBe("TOKEN_EXPIRED");
  });

  it("detects outdated and stale agents",()=>{
    const report = evaluateAgentFleet([{
      id:"agent-1",
      tenantId:"org-1",
      platform:"linux",
      version:"1.0.0",
      certificateFingerprint:fingerprint,
      status:"active",
      enrolledAt:"2026-07-20T08:00:00.000Z",
      lastHeartbeatAt:"2026-07-20T09:00:00.000Z"
    }],{
      minimumVersions:{linux:"1.2.0"},
      heartbeatTimeoutSeconds:120
    },new Date("2026-07-20T10:00:00.000Z"));

    expect(report.decision).toBe("degraded");
    expect(report.staleAgents).toEqual(["agent-1"]);
    expect(report.outdatedAgents).toEqual(["agent-1"]);
  });

  it("compares semantic version segments",()=>{
    expect(compareVersions("1.10.0","1.9.9")).toBe(1);
    expect(compareVersions("2.0","2.0.0")).toBe(0);
  });
});
