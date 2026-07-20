export type CertificateStatus = "active" | "revoked" | "expired" | "pending-renewal";

export interface AgentCertificate {
  id: string;
  tenantId: string;
  agentId: string;
  serialNumber: string;
  fingerprintSha256: string;
  issuerId: string;
  keyAlgorithm: "rsa" | "ecdsa" | "ed25519";
  keySize?: number;
  issuedAt: string;
  expiresAt: string;
  status: CertificateStatus;
  revokedAt?: string;
  revocationReason?: string;
}

export interface CertificateAuthorityPolicy {
  trustedIssuerIds: string[];
  minimumRsaKeySize: number;
  renewalWindowDays: number;
  maximumLifetimeDays: number;
}

export interface CertificateFinding {
  certificateId: string;
  code:
    | "UNTRUSTED_ISSUER"
    | "WEAK_RSA_KEY"
    | "CERTIFICATE_EXPIRED"
    | "CERTIFICATE_REVOKED"
    | "RENEWAL_REQUIRED"
    | "LIFETIME_TOO_LONG"
    | "INVALID_FINGERPRINT"
    | "DUPLICATE_SERIAL";
}

export interface CertificateLifecycleReport {
  findings: CertificateFinding[];
  renewalCertificateIds: string[];
  revokedCertificateIds: string[];
  expiredCertificateIds: string[];
  duplicateSerials: string[];
  decision: "healthy" | "renew" | "block";
}
