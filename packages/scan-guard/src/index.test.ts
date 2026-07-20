import {describe, expect, it} from "vitest";
import {guardScanCandidates, withScanTimeout} from "./index.js";

describe("scan guard", () => {
  it("rejects traversal, symlinks and oversized files", () => {
    const result = guardScanCandidates([
      {path:"src/app.ts", sizeBytes:1000},
      {path:"../secret.env", sizeBytes:100},
      {path:"linked.ts", sizeBytes:100, isSymbolicLink:true},
      {path:"large.ts", sizeBytes:3 * 1024 * 1024}
    ]);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected.map(item => item.reason)).toContain("UNSAFE_PATH");
    expect(result.rejected.map(item => item.reason)).toContain("SYMLINK_NOT_ALLOWED");
    expect(result.rejected.map(item => item.reason)).toContain("FILE_SIZE_LIMIT_EXCEEDED");
  });

  it("aborts operations after timeout", async () => {
    await expect(withScanTimeout(async signal => {
      await new Promise<void>((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("ABORTED")));
        setTimeout(resolve, 50);
      });
      return true;
    }, 5)).rejects.toThrow("ABORTED");
  });
});
