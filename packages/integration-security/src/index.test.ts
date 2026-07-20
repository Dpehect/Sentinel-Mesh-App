import {describe, expect, it} from "vitest";
import {
  createWebhookSignature,
  redactSecrets,
  sanitizeLogMetadata,
  verifyWebhook
} from "./index.js";

describe("integration security", () => {
  it("verifies valid HMAC webhook signatures", () => {
    const payload = '{"event":"push"}';
    const secret = "local-test-secret";
    const signature = createWebhookSignature(payload, secret);

    expect(verifyWebhook({payload, secret, signature}).valid).toBe(true);
  });

  it("rejects stale webhook requests", () => {
    const payload = "{}";
    const secret = "secret";
    const signature = createWebhookSignature(payload, secret);

    expect(verifyWebhook({
      payload,
      secret,
      signature,
      timestamp:100,
      now:1000,
      toleranceSeconds:300
    }).reason).toBe("STALE_REQUEST");
  });

  it("redacts secrets from logs", () => {
    expect(redactSecrets("Authorization: Bearer abc.def.ghi")).not.toContain("abc.def.ghi");
    expect(sanitizeLogMetadata({apiKey:"top-secret"}).apiKey).toBe("[REDACTED]");
  });
});
