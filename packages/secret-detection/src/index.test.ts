import {describe, expect, it} from "vitest";
import {
  scanForSecrets,
  shouldBlockSecretFinding
} from "./index.js";

describe("secret detection", () => {
  it("detects and masks known token formats", () => {
    const findings = scanForSecrets({
      path:".env",
      content:"GITHUB_TOKEN=ghp_1234567890abcdefghijklmnop"
    });

    expect(findings.some(item => item.kind === "github-token")).toBe(true);
    expect(findings[0].maskedValue).not.toContain("1234567890abcdefghijklmnop");
  });

  it("detects private keys", () => {
    const findings = scanForSecrets({
      path:"key.pem",
      content:"-----BEGIN PRIVATE KEY-----"
    });

    expect(findings[0].kind).toBe("private-key");
    expect(shouldBlockSecretFinding(findings[0])).toBe(true);
  });

  it("flags high entropy token candidates", () => {
    const findings = scanForSecrets({
      path:"config.ts",
      content:'const value = "aZ9Xv7Qp2Lm8Nw4Rt6Yk3Bc5Df1Gh0J";'
    });

    expect(findings.some(item => item.kind === "high-entropy-token")).toBe(true);
  });
});
