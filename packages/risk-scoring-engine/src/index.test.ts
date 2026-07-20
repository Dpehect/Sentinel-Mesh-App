import {describe, expect, it} from "vitest";
import {calculateEnterpriseRisk} from "./index.js";

describe("enterprise risk scoring", () => {
  it("calculates weighted business risk", () => {
    const result = calculateEnterpriseRisk([
      {category:"cloud", score:80, weight:2, businessImpact:100},
      {category:"identity", score:40, weight:1}
    ]);

    expect(result.score).toBeGreaterThan(60);
    expect(result.level).toBe("HIGH");
    expect(result.categoryScores.cloud).toBe(100);
  });

  it("returns low risk for no signals", () => {
    expect(calculateEnterpriseRisk([])).toEqual({
      score:0, level:"LOW", categoryScores:{}
    });
  });
});
