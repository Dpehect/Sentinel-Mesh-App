import {createHmac, timingSafeEqual} from "node:crypto";
import type {
  WebhookVerificationInput,
  WebhookVerificationResult
} from "./types.js";

export type {WebhookVerificationInput, WebhookVerificationResult};

function normalizeSignature(signature: string): string {
  return signature.startsWith("sha256=") ? signature.slice(7) : signature;
}

export function createWebhookSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWebhook(
  input: WebhookVerificationInput
): WebhookVerificationResult {
  if (!input.signature) return {valid:false, reason:"MISSING_SIGNATURE"};

  if (input.timestamp !== undefined) {
    const now = input.now ?? Math.floor(Date.now() / 1000);
    const tolerance = input.toleranceSeconds ?? 300;

    if (Math.abs(now - input.timestamp) > tolerance) {
      return {valid:false, reason:"STALE_REQUEST"};
    }
  }

  const expected = Buffer.from(createWebhookSignature(input.payload, input.secret), "hex");
  const receivedHex = normalizeSignature(input.signature);

  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
    return {valid:false, reason:"INVALID_SIGNATURE"};
  }

  const received = Buffer.from(receivedHex, "hex");
  const valid = expected.length === received.length && timingSafeEqual(expected, received);

  return valid
    ? {valid:true}
    : {valid:false, reason:"INVALID_SIGNATURE"};
}

const secretPatterns: RegExp[] = [
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bAIza[0-9A-Za-z\-_]{30,}\b/g,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9._\-]+\b/gi,
  /\b(password|secret|token|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi
];

export function redactSecrets(value: string): string {
  return secretPatterns.reduce(
    (output, pattern) => output.replace(pattern, "[REDACTED]"),
    value
  );
}

export function sanitizeLogMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = /password|secret|token|authorization|api[_-]?key/i;

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (sensitiveKeys.test(key)) return [key, "[REDACTED]"];
      if (typeof value === "string") return [key, redactSecrets(value)];
      return [key, value];
    })
  );
}
