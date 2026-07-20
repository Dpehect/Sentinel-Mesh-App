import {
  createHash,
  createHmac,
  timingSafeEqual
} from "node:crypto";

import type {
  AuditChainPolicy,
  AuditVerificationResult,
  RolloutAuditInput,
  RolloutAuditRecord
} from "./types.js";

export type {
  AuditChainPolicy,
  AuditDecision,
  AuditVerificationResult,
  RolloutAuditInput,
  RolloutAuditRecord
} from "./types.js";

const GENESIS_HASH = "GENESIS";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sign(recordHash: string, signingKey: string): string {
  return createHmac("sha256", signingKey)
    .update(recordHash)
    .digest("hex");
}

function signatureMatches(
  recordHash: string,
  signature: string,
  signingKey: string
): boolean {
  const expected = Buffer.from(sign(recordHash, signingKey), "hex");
  const actual = Buffer.from(signature, "hex");

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function canonicalPayload(input: RolloutAuditInput): string {
  return stableStringify({
    rolloutId: input.rolloutId,
    wave: input.wave,
    action: input.action,
    actor: input.actor,
    occurredAt: input.occurredAt,
    idempotencyKey: input.idempotencyKey,
    details: input.details ?? {}
  });
}

export function appendAuditRecord(
  chain: RolloutAuditRecord[],
  input: RolloutAuditInput,
  signingKey: string
): RolloutAuditRecord {
  if (!signingKey.trim()) {
    throw new Error("signingKey is required");
  }

  if (!input.idempotencyKey.trim()) {
    throw new Error("idempotencyKey is required");
  }

  const previous = chain.at(-1);
  const sequence = previous ? previous.sequence + 1 : 1;
  const previousHash = previous?.recordHash ?? GENESIS_HASH;
  const payloadHash = sha256(canonicalPayload(input));
  const recordHash = sha256(stableStringify({
    sequence,
    previousHash,
    payloadHash
  }));

  return {
    ...input,
    sequence,
    previousHash,
    payloadHash,
    recordHash,
    signature: sign(recordHash, signingKey)
  };
}

export function verifyAuditChain(
  chain: RolloutAuditRecord[],
  signingKey: string,
  policy: AuditChainPolicy,
  now = new Date()
): AuditVerificationResult {
  const seenIdempotencyKeys = new Set<string>();
  let previousHash = GENESIS_HASH;
  let expectedSequence = 1;

  for (const record of chain) {
    if (
      policy.requireStrictSequence &&
      record.sequence !== expectedSequence
    ) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Audit sequence is not contiguous",
        policy
      );
    }

    if (record.previousHash !== previousHash) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Previous-hash link is invalid",
        policy
      );
    }

    if (
      policy.rejectDuplicateIdempotencyKeys &&
      seenIdempotencyKeys.has(record.idempotencyKey)
    ) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Duplicate idempotency key detected",
        policy
      );
    }

    const occurredAt = new Date(record.occurredAt).getTime();
    if (!Number.isFinite(occurredAt)) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Invalid audit timestamp",
        policy
      );
    }

    const futureSkew =
      occurredAt - now.getTime();

    if (
      futureSkew >
      policy.maximumClockSkewSeconds * 1000
    ) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Audit timestamp exceeds allowed clock skew",
        policy
      );
    }

    const payloadHash = sha256(canonicalPayload(record));
    if (payloadHash !== record.payloadHash) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Audit payload hash does not match",
        policy
      );
    }

    const recordHash = sha256(stableStringify({
      sequence: record.sequence,
      previousHash: record.previousHash,
      payloadHash: record.payloadHash
    }));

    if (recordHash !== record.recordHash) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Audit record hash does not match",
        policy
      );
    }

    if (!signatureMatches(record.recordHash, record.signature, signingKey)) {
      return failure(
        record.sequence,
        expectedSequence - 1,
        "Audit signature verification failed",
        policy
      );
    }

    seenIdempotencyKeys.add(record.idempotencyKey);
    previousHash = record.recordHash;
    expectedSequence += 1;
  }

  return {
    valid: true,
    decision: "accept",
    verifiedRecords: chain.length,
    firstInvalidSequence: null,
    reason: "Audit chain integrity verified"
  };
}

function failure(
  sequence: number,
  verifiedRecords: number,
  reason: string,
  policy: AuditChainPolicy
): AuditVerificationResult {
  return {
    valid: false,
    decision: policy.pauseOnIntegrityFailure
      ? "pause-rollout"
      : "reject",
    verifiedRecords,
    firstInvalidSequence: sequence,
    reason
  };
}

export function createAuditVerificationSummary(
  result: AuditVerificationResult
): string {
  return [
    `Audit valid: ${result.valid}`,
    `Decision: ${result.decision}`,
    `Verified records: ${result.verifiedRecords}`,
    `First invalid sequence: ${result.firstInvalidSequence ?? "none"}`,
    `Reason: ${result.reason}`
  ].join("\n");
}
