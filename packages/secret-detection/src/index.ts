import {createHash} from "node:crypto";
import type {SecretFinding, SecretKind, SecretScanInput} from "./types.js";

export type {SecretFinding, SecretKind, SecretScanInput} from "./types.js";

interface Rule {
  kind: SecretKind;
  pattern: RegExp;
  confidence: number;
  remediation: string;
}

const rules: Rule[] = [
  {
    kind:"github-token",
    pattern:/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
    confidence:0.99,
    remediation:"Revoke the token and replace it with a secret-manager reference."
  },
  {
    kind:"google-api-key",
    pattern:/\bAIza[0-9A-Za-z\-_]{30,}\b/g,
    confidence:0.99,
    remediation:"Rotate the Google API key and restrict its allowed origins and APIs."
  },
  {
    kind:"openai-key",
    pattern:/\bsk-[A-Za-z0-9_-]{20,}\b/g,
    confidence:0.98,
    remediation:"Revoke the key and load it from a protected environment variable."
  },
  {
    kind:"aws-access-key",
    pattern:/\bAKIA[0-9A-Z]{16}\b/g,
    confidence:0.99,
    remediation:"Disable the access key and issue a least-privilege replacement."
  },
  {
    kind:"private-key",
    pattern:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    confidence:1,
    remediation:"Remove the private key from source control and rotate the credential."
  },
  {
    kind:"generic-secret",
    pattern:/\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?([^\s"'`;]{8,})/gi,
    confidence:0.75,
    remediation:"Move the credential to a protected secret store and rotate it."
  }
];

function mask(value: string): string {
  if (value.length <= 8) return "[REDACTED]";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function entropy(value: string): number {
  const counts = new Map<string, number>();
  for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1);

  let result = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    result -= probability * Math.log2(probability);
  }

  return result;
}

function createFinding(
  kind: SecretKind,
  path: string,
  line: number,
  value: string,
  confidence: number,
  remediation: string
): SecretFinding {
  const fingerprint = createHash("sha256")
    .update(`${kind}|${path}|${line}|${value}`)
    .digest("hex");

  return {
    id:`secret_${fingerprint.slice(0, 16)}`,
    kind,
    path,
    line,
    confidence,
    fingerprint,
    maskedValue:mask(value),
    remediation
  };
}

export function scanForSecrets(input: SecretScanInput): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const seen = new Set<string>();
  const lines = input.content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const rule of rules) {
      for (const match of line.matchAll(rule.pattern)) {
        const value = match[0];
        const finding = createFinding(
          rule.kind,
          input.path,
          index + 1,
          value,
          rule.confidence,
          rule.remediation
        );

        if (!seen.has(finding.fingerprint)) {
          seen.add(finding.fingerprint);
          findings.push(finding);
        }
      }
    }

    const candidates = line.match(/[A-Za-z0-9+/=_-]{24,}/g) ?? [];
    for (const value of candidates) {
      if (entropy(value) < 4.2) continue;

      const finding = createFinding(
        "high-entropy-token",
        input.path,
        index + 1,
        value,
        0.65,
        "Review the token, rotate it if sensitive, and store it outside source control."
      );

      if (!seen.has(finding.fingerprint)) {
        seen.add(finding.fingerprint);
        findings.push(finding);
      }
    }
  }

  return findings;
}

export function shouldBlockSecretFinding(
  finding: SecretFinding,
  threshold = 0.9
): boolean {
  return finding.confidence >= threshold;
}

export function redactDetectedSecrets(
  content: string,
  findings: SecretFinding[]
): string {
  let output = content;

  for (const finding of findings) {
    const visiblePrefix = finding.maskedValue.split("…")[0];
    if (!visiblePrefix || visiblePrefix === "[REDACTED]") continue;

    const escaped = visiblePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replace(new RegExp(`${escaped}[^\s"'\`;]*`, "g"), "[REDACTED]");
  }

  return output;
}
