export type RotationKeyStatus = "active" | "staged" | "retiring" | "revoked";

export interface AgentTrustKey {
  id: string;
  tenantId: string;
  purpose: "enrollment" | "command" | "policy" | "update" | "attestation";
  publicKeyFingerprint: string;
  algorithm: "rsa" | "ecdsa" | "ed25519";
  createdAt: string;
  activatesAt: string;
  retiresAt?: string;
  status: RotationKeyStatus;
  compromised?: boolean;
}

export interface RotationPolicy {
  maximumKeyAgeDays: number;
  overlapWindowHours: number;
  minimumTrustedKeys: number;
  allowedAlgorithms: AgentTrustKey["algorithm"][];
}

export interface KeyRotationPlan {
  purpose: AgentTrustKey["purpose"];
  currentKeyIds: string[];
  stagedKeyIds: string[];
  retireKeyIds: string[];
  revokeKeyIds: string[];
  findings: string[];
  decision: "healthy" | "rotate" | "emergency-rotate";
}

export interface TrustStore {
  tenantId: string;
  trustedKeyIds: string[];
  revokedKeyIds: string[];
  version: number;
}

export interface TrustStoreTransition {
  nextStore: TrustStore;
  activatedKeyIds: string[];
  retiredKeyIds: string[];
  revokedKeyIds: string[];
}
