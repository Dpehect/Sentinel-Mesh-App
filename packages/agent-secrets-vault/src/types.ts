export type SecretStatus = "active" | "rotating" | "revoked" | "expired";

export interface AgentSecret {
  id: string;
  tenantId: string;
  name: string;
  purpose: "api-token" | "integration" | "bootstrap" | "encryption";
  ciphertext: string;
  keyId: string;
  version: number;
  createdAt: string;
  expiresAt?: string;
  rotationDueAt?: string;
  status: SecretStatus;
  allowedAgentIds: string[];
}

export interface SecretLeaseRequest {
  tenantId: string;
  agentId: string;
  secretId: string;
  requestedAt: string;
  leaseSeconds: number;
  nonce: string;
}

export interface SecretLease {
  id: string;
  tenantId: string;
  agentId: string;
  secretId: string;
  secretVersion: number;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
}

export interface SecretVaultPolicy {
  maximumLeaseSeconds: number;
  maximumSecretAgeDays: number;
  allowedKeyIds: string[];
}

export interface SecretVaultReport {
  rotationSecretIds: string[];
  revokedSecretIds: string[];
  expiredSecretIds: string[];
  invalidEncryptionSecretIds: string[];
  decision: "healthy" | "rotate" | "block";
}
