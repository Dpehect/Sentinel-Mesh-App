export interface WebhookVerificationInput {
  payload: string;
  signature: string;
  secret: string;
  timestamp?: number;
  now?: number;
  toleranceSeconds?: number;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: "INVALID_SIGNATURE" | "STALE_REQUEST" | "MISSING_SIGNATURE";
}
