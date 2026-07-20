import {describe, expect, it} from "vitest";
import {
  createReleaseAttestation,
  createSbom,
  evaluateDependencyPolicy,
  verifySbom
} from "./index.js";

describe("supply chain security", () => {
  it("creates a verifiable deterministic SBOM", () => {
    const sbom = createSbom([
      {
        name:"typescript",
        version:"5.7.3",
        ecosystem:"npm",
        checksum:"sha256:abc",
        direct:true
      }
    ], "3.0.0", "2026-07-20T00:00:00.000Z");

    expect(verifySbom(sbom)).toBe(true);
  });

  it("blocks denied and unpinned dependencies", () => {
    const result = evaluateDependencyPolicy([
      {
        name:"unsafe-package",
        version:"latest",
        ecosystem:"npm",
        direct:true
      }
    ], {
      deniedPackages:["unsafe-package"],
      deniedLicenses:[],
      requireChecksums:true,
      allowUnpinnedVersions:false
    });

    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBe(3);
  });

  it("creates stable release attestations", () => {
    const first = createReleaseAttestation("app.tgz", "a", "b", "c");
    const second = createReleaseAttestation("app.tgz", "a", "b", "c");
    expect(first).toBe(second);
  });
});
