import {createHash} from "node:crypto";
import type {
  DetectionReleaseDecision,
  DetectionRule,
  DetectionTestCase,
  DetectionTestResult,
  DetectionValidation
} from "./types.js";

export type {
  DetectionReleaseDecision,
  DetectionRule,
  DetectionSeverity,
  DetectionStatus,
  DetectionTestCase,
  DetectionTestResult,
  DetectionValidation
} from "./types.js";

export function validateDetectionRule(
  rule: DetectionRule
): DetectionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rule.id.trim()) errors.push("RULE_ID_REQUIRED");
  if (!rule.title.trim()) errors.push("RULE_TITLE_REQUIRED");
  if (!rule.description.trim()) warnings.push("RULE_DESCRIPTION_MISSING");
  if (rule.eventTypes.length === 0) errors.push("EVENT_TYPE_REQUIRED");
  if (rule.requiredFields.length === 0) warnings.push("NO_REQUIRED_FIELDS");
  if (rule.version < 1) errors.push("INVALID_RULE_VERSION");
  if (!rule.author.trim()) errors.push("RULE_AUTHOR_REQUIRED");
  if (rule.status === "active" && rule.tags.length === 0) {
    warnings.push("ACTIVE_RULE_WITHOUT_TAGS");
  }

  return {
    valid:errors.length === 0,
    errors,
    warnings
  };
}

export function matchesDetectionRule(
  rule: DetectionRule,
  event: Record<string, unknown>
): boolean {
  const eventType = String(event.type ?? "");
  if (!rule.eventTypes.includes(eventType)) return false;

  const fieldMatches = rule.requiredFields.map(field => {
    const value = event[field];
    return value !== undefined && value !== null && value !== "";
  });

  return rule.condition === "all"
    ? fieldMatches.every(Boolean)
    : fieldMatches.some(Boolean);
}

export function runDetectionTests(
  rule: DetectionRule,
  cases: DetectionTestCase[]
): DetectionTestResult {
  const failures: string[] = [];
  let passed = 0;

  for (const testCase of cases.filter(item => item.ruleId === rule.id)) {
    const actual = matchesDetectionRule(rule, testCase.event);
    if (actual === testCase.shouldMatch) {
      passed += 1;
    } else {
      failures.push(testCase.id);
    }
  }

  return {
    passed,
    failed:failures.length,
    failures
  };
}

export function createDetectionChecksum(
  rule: DetectionRule
): string {
  const canonical = JSON.stringify({
    id:rule.id,
    title:rule.title,
    description:rule.description,
    severity:rule.severity,
    eventTypes:[...rule.eventTypes].sort(),
    requiredFields:[...rule.requiredFields].sort(),
    condition:rule.condition,
    tags:[...rule.tags].sort(),
    version:rule.version,
    author:rule.author
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export function evaluateDetectionRelease(
  rule: DetectionRule,
  tests: DetectionTestResult,
  minimumTests = 1
): DetectionReleaseDecision {
  const validation = validateDetectionRule(rule);
  const checksum = createDetectionChecksum(rule);

  if (!validation.valid) {
    return {allowed:false, reason:"VALIDATION_FAILED", checksum};
  }

  if (tests.passed + tests.failed < minimumTests) {
    return {allowed:false, reason:"INSUFFICIENT_TEST_COVERAGE", checksum};
  }

  if (tests.failed > 0) {
    return {allowed:false, reason:"DETECTION_TESTS_FAILED", checksum};
  }

  if (rule.status === "disabled") {
    return {allowed:false, reason:"RULE_DISABLED", checksum};
  }

  return {allowed:true, checksum};
}
