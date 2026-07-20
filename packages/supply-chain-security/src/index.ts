import {createHash} from "node:crypto";
import type {
  DependencyPolicy,
  DependencyPolicyResult,
  SbomDocument,
  SoftwareComponent
} from "./types.js";

export type {
  DependencyPolicy,
  DependencyPolicyResult,
  SbomDocument,
  SoftwareComponent
} from "./types.js";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createSbom(
  components: SoftwareComponent[],
  sourceVersion: string,
  generatedAt = new Date().toISOString()
): SbomDocument {
  const sorted = [...components].sort((a, b) =>
    `${a.ecosystem}:${a.name}:${a.version}`.localeCompare(
      `${b.ecosystem}:${b.name}:${b.version}`
    )
  );

  const checksum = hash(JSON.stringify({
    format:"Sentinel-SBOM-1",
    generatedAt,
    sourceVersion,
    components:sorted
  }));

  return {
    format:"Sentinel-SBOM-1",
    generatedAt,
    sourceVersion,
    components:sorted,
    checksum
  };
}

export function verifySbom(sbom: SbomDocument): boolean {
  return createSbom(
    sbom.components,
    sbom.sourceVersion,
    sbom.generatedAt
  ).checksum === sbom.checksum;
}

export function evaluateDependencyPolicy(
  components: SoftwareComponent[],
  policy: DependencyPolicy
): DependencyPolicyResult {
  const violations: string[] = [];

  for (const component of components) {
    if (policy.deniedPackages.includes(component.name)) {
      violations.push(`DENIED_PACKAGE:${component.name}`);
    }

    if (component.license && policy.deniedLicenses.includes(component.license)) {
      violations.push(`DENIED_LICENSE:${component.name}:${component.license}`);
    }

    if (policy.requireChecksums && !component.checksum) {
      violations.push(`MISSING_CHECKSUM:${component.name}`);
    }

    if (
      !policy.allowUnpinnedVersions &&
      ["*", "latest", "next"].includes(component.version.toLowerCase())
    ) {
      violations.push(`UNPINNED_VERSION:${component.name}`);
    }
  }

  return {
    allowed:violations.length === 0,
    violations
  };
}

export function createReleaseAttestation(
  artifactName: string,
  artifactChecksum: string,
  sbomChecksum: string,
  commitSha: string
): string {
  return hash([
    artifactName,
    artifactChecksum,
    sbomChecksum,
    commitSha
  ].join("|"));
}
