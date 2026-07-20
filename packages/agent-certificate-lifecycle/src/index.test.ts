import{describe,expect,it}from"vitest";
import{
  evaluateCertificate,
  evaluateCertificateFleet
}from"./index.js";

const policy={
  trustedIssuerIds:["ca-1"],
  minimumRsaKeySize:2048,
  renewalWindowDays:30,
  maximumLifetimeDays:365
};

const certificate={
  id:"cert-1",
  tenantId:"org-1",
  agentId:"agent-1",
  serialNumber:"SERIAL-1",
  fingerprintSha256:"a".repeat(64),
  issuerId:"ca-1",
  keyAlgorithm:"rsa" as const,
  keySize:2048,
  issuedAt:"2026-01-01T00:00:00.000Z",
  expiresAt:"2026-08-01T00:00:00.000Z",
  status:"active" as const
};

describe("agent certificate lifecycle",()=>{
  it("requests renewal inside the renewal window",()=>{
    const findings=evaluateCertificate(
      certificate,
      policy,
      new Date("2026-07-20T00:00:00.000Z")
    );

    expect(findings.some(item=>item.code==="RENEWAL_REQUIRED")).toBe(true);
  });

  it("blocks weak RSA certificates",()=>{
    const report=evaluateCertificateFleet([
      {...certificate,keySize:1024}
    ],policy,new Date("2026-06-01T00:00:00.000Z"));

    expect(report.decision).toBe("block");
    expect(report.findings.some(item=>item.code==="WEAK_RSA_KEY")).toBe(true);
  });

  it("detects duplicate certificate serials",()=>{
    const report=evaluateCertificateFleet([
      certificate,
      {...certificate,id:"cert-2",agentId:"agent-2"}
    ],policy,new Date("2026-06-01T00:00:00.000Z"));

    expect(report.duplicateSerials).toEqual(["SERIAL-1"]);
    expect(report.decision).toBe("block");
  });

  it("blocks revoked certificates",()=>{
    const report=evaluateCertificateFleet([
      {...certificate,status:"revoked" as const,revokedAt:"2026-05-01T00:00:00.000Z"}
    ],policy,new Date("2026-06-01T00:00:00.000Z"));

    expect(report.revokedCertificateIds).toEqual(["cert-1"]);
  });
});
