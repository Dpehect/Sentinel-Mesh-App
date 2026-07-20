import type {
  AgentCertificate,
  CertificateAuthorityPolicy,
  CertificateFinding,
  CertificateLifecycleReport
} from "./types.js";

export type {
  AgentCertificate,
  CertificateAuthorityPolicy,
  CertificateFinding,
  CertificateLifecycleReport,
  CertificateStatus
} from "./types.js";

export function evaluateCertificate(
  certificate:AgentCertificate,
  policy:CertificateAuthorityPolicy,
  now=new Date()
):CertificateFinding[]{
  const findings:CertificateFinding[]=[];
  const add=(code:CertificateFinding["code"])=>findings.push({
    certificateId:certificate.id,
    code
  });

  if(!policy.trustedIssuerIds.includes(certificate.issuerId)){
    add("UNTRUSTED_ISSUER");
  }

  if(
    certificate.keyAlgorithm==="rsa" &&
    (certificate.keySize ?? 0)<policy.minimumRsaKeySize
  ){
    add("WEAK_RSA_KEY");
  }

  if(!/^[a-f0-9]{64}$/i.test(certificate.fingerprintSha256)){
    add("INVALID_FINGERPRINT");
  }

  const issuedAt=new Date(certificate.issuedAt).getTime();
  const expiresAt=new Date(certificate.expiresAt).getTime();
  const current=now.getTime();
  const lifetimeDays=(expiresAt-issuedAt)/(24*60*60*1000);
  const daysRemaining=(expiresAt-current)/(24*60*60*1000);

  if(lifetimeDays>policy.maximumLifetimeDays){
    add("LIFETIME_TOO_LONG");
  }

  if(
    certificate.status==="revoked" ||
    certificate.revokedAt
  ){
    add("CERTIFICATE_REVOKED");
  }else if(current>=expiresAt || certificate.status==="expired"){
    add("CERTIFICATE_EXPIRED");
  }else if(
    daysRemaining<=policy.renewalWindowDays ||
    certificate.status==="pending-renewal"
  ){
    add("RENEWAL_REQUIRED");
  }

  return findings;
}

export function evaluateCertificateFleet(
  certificates:AgentCertificate[],
  policy:CertificateAuthorityPolicy,
  now=new Date()
):CertificateLifecycleReport{
  const findings=certificates.flatMap(certificate=>
    evaluateCertificate(certificate,policy,now)
  );

  const serialMap=new Map<string,string[]>();
  for(const certificate of certificates){
    serialMap.set(
      certificate.serialNumber,
      [...(serialMap.get(certificate.serialNumber) ?? []),certificate.id]
    );
  }

  const duplicateSerials=[...serialMap.entries()]
    .filter(([,ids])=>ids.length>1)
    .map(([serial])=>serial);

  for(const serial of duplicateSerials){
    for(const certificateId of serialMap.get(serial) ?? []){
      findings.push({certificateId,code:"DUPLICATE_SERIAL"});
    }
  }

  const renewalCertificateIds=[...new Set(
    findings
      .filter(item=>item.code==="RENEWAL_REQUIRED")
      .map(item=>item.certificateId)
  )];

  const revokedCertificateIds=[...new Set(
    findings
      .filter(item=>item.code==="CERTIFICATE_REVOKED")
      .map(item=>item.certificateId)
  )];

  const expiredCertificateIds=[...new Set(
    findings
      .filter(item=>item.code==="CERTIFICATE_EXPIRED")
      .map(item=>item.certificateId)
  )];

  const blocking=findings.some(item=>[
    "UNTRUSTED_ISSUER",
    "WEAK_RSA_KEY",
    "CERTIFICATE_EXPIRED",
    "CERTIFICATE_REVOKED",
    "INVALID_FINGERPRINT",
    "DUPLICATE_SERIAL"
  ].includes(item.code));

  return{
    findings,
    renewalCertificateIds,
    revokedCertificateIds,
    expiredCertificateIds,
    duplicateSerials,
    decision:blocking
      ?"block"
      :renewalCertificateIds.length>0
        ?"renew"
        :"healthy"
  };
}

export function createCertificateLifecycleSummary(
  report:CertificateLifecycleReport
):string{
  return[
    `Certificate lifecycle decision: ${report.decision}`,
    `Findings: ${report.findings.length}`,
    `Renewals required: ${report.renewalCertificateIds.length}`,
    `Revoked certificates: ${report.revokedCertificateIds.length}`,
    `Expired certificates: ${report.expiredCertificateIds.length}`,
    `Duplicate serials: ${report.duplicateSerials.length}`
  ].join("\n");
}
