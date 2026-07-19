import { describe, expect, it } from "vitest";
import { config } from "./config";

// This test intentionally avoids opening Redis; integration tests run through Docker.
describe("queue configuration", () => {
  it("uses bounded retry and concurrency settings", () => {
    expect(config.SCAN_ATTEMPTS).toBeGreaterThanOrEqual(1);
    expect(config.SCAN_ATTEMPTS).toBeLessThanOrEqual(10);
    expect(config.SCAN_CONCURRENCY).toBeGreaterThanOrEqual(1);
    expect(config.SCAN_CONCURRENCY).toBeLessThanOrEqual(8);
  });

  it("enforces scan and repository limits", () => {
    expect(config.SCAN_TIMEOUT_MS).toBeGreaterThanOrEqual(30_000);
    expect(config.MAX_REPOSITORY_FILES).toBeGreaterThanOrEqual(100);
    expect(config.MAX_REPOSITORY_BYTES).toBeGreaterThanOrEqual(1_000_000);
  });
});
