export interface RuntimeBaseline {
  tenantId: string;
  agentId: string;
  platform: string;
  approvedBinaryHashes: string[];
  approvedModuleHashes: string[];
  secureBootRequired: boolean;
  tpmRequired: boolean;
  minimumAgentVersion: string;
}

export interface RuntimeAttestation {
  tenantId: string;
  agentId: string;
  platform: string;
  agentVersion: string;
  binaryHash: string;
  loadedModuleHashes: string[];
  secureBootEnabled: boolean;
  tpmPresent: boolean;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  signerId: string;
  signature: string;
}

export interface RuntimeAttestationState {
  tenantId: string;
  agentId: string;
  usedNonces: string[];
  lastAcceptedAt?: string;
}

export interface RuntimeAttestationPolicy {
  trustedSigners: string[];
  maxLifetimeSeconds: number;
  maximumUnknownModules: number;
}

export interface RuntimeAttestationReport {
  findings: string[];
  unknownModules: string[];
  trusted: boolean;
  nextState: RuntimeAttestationState;
  decision: "trust" | "quarantine" | "reject";
}
