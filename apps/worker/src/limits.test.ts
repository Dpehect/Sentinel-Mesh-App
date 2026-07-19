import { describe, expect, it } from "vitest";
import { withTimeout } from "./limits";

describe("withTimeout", () => {
  it("returns a result before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 100, "test")).resolves.toBe("ok");
  });

  it("rejects work that exceeds the deadline", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 40));
    await expect(withTimeout(slow, 5, "slow operation")).rejects.toThrow("timed out");
  });
});
