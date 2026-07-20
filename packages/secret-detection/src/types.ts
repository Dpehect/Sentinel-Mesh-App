export type SecretKind =
  | "github-token"
  | "google-api-key"
  | "openai-key"
  | "aws-access-key"
  | "private-key"
  | "generic-secret"
  | "high-entropy-token";

export interface SecretFinding {
  id: string;
  kind: SecretKind;
  path: string;
  line: number;
  confidence: number;
  fingerprint: string;
  maskedValue: string;
  remediation: string;
}

export interface SecretScanInput {
  path: string;
  content: string;
}
