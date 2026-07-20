import{describe,expect,it}from"vitest";
import{evaluateFleetHealth,scoreAgentHealth}from"./index.js";

const weights={
  telemetryIntegrity:20,
  runtimeAttestation:20,
  certificate:10,
  policyCompliance:10,
  updateCompliance:10,
  resourceHealth:10,
  connectivity:10,
  selfProtection:10
};

const healthy={
  agentId:"agent-1",
  telemetryIntegrityScore:95,
  runtimeAttestationScore:95,
  certificateScore:90,
  policyComplianceScore:90,
  updateComplianceScore:90,
  resourceHealthScore:85,
  connectivityScore:90,
  selfProtectionScore:95,
  criticalFindings:[]
};

describe("agent health scoring",()=>{
  it("scores healthy agents",()=>{
    const result=scoreAgentHealth(healthy,weights);
    expect(result.status).toBe("healthy");
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("applies strong tamper penalties",()=>{
    const result=scoreAgentHealth({
      ...healthy,
      criticalFindings:["AGENT_TAMPER_DETECTED"]
    },weights);
    expect(result.score).toBeLessThan(80);
    expect(result.penalties).toContain("AGENT_TAMPER_DETECTED");
  });

  it("produces remediation recommendations",()=>{
    const result=scoreAgentHealth({
      ...healthy,
      certificateScore:40,
      policyComplianceScore:40
    },weights);
    expect(result.recommendations).toContain("rotate-agent-certificate");
    expect(result.recommendations).toContain("reapply-agent-policy");
  });

  it("contains fleets with critical agents",()=>{
    const report=evaluateFleetHealth([
      healthy,
      {
        ...healthy,
        agentId:"agent-2",
        telemetryIntegrityScore:10,
        runtimeAttestationScore:10,
        selfProtectionScore:10,
        criticalFindings:["KEY_COMPROMISED"]
      }
    ],weights);
    expect(report.decision).toBe("contain");
    expect(report.criticalAgents).toContain("agent-2");
  });
});
