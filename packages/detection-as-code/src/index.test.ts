import {describe, expect, it} from "vitest";
import {
  evaluateDetectionRelease,
  runDetectionTests,
  validateDetectionRule
} from "./index.js";

const rule = {
  id:"DET-001",
  title:"Privileged action after unusual login",
  description:"Detects privileged activity following suspicious authentication.",
  severity:"critical" as const,
  status:"testing" as const,
  eventTypes:["privileged-action"],
  requiredFields:["entityId","sourceIp"],
  condition:"all" as const,
  tags:["identity","privilege"],
  version:1,
  author:"security-team"
};

describe("Detection as Code", () => {
  it("validates complete rules", () => {
    expect(validateDetectionRule(rule).valid).toBe(true);
  });

  it("runs positive and negative test cases", () => {
    const result = runDetectionTests(rule, [
      {
        id:"positive",
        ruleId:"DET-001",
        event:{type:"privileged-action", entityId:"user-1", sourceIp:"203.0.113.1"},
        shouldMatch:true
      },
      {
        id:"negative",
        ruleId:"DET-001",
        event:{type:"login", entityId:"user-1"},
        shouldMatch:false
      }
    ]);

    expect(result.failed).toBe(0);
    expect(result.passed).toBe(2);
    expect(evaluateDetectionRelease(rule, result).allowed).toBe(true);
  });

  it("blocks releases when tests fail", () => {
    const result = runDetectionTests(rule, [{
      id:"bad-test",
      ruleId:"DET-001",
      event:{type:"login"},
      shouldMatch:true
    }]);

    expect(evaluateDetectionRelease(rule, result).reason)
      .toBe("DETECTION_TESTS_FAILED");
  });
});
