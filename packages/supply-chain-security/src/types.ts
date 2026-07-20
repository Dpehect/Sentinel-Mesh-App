export interface SoftwareComponent {
  name: string;
  version: string;
  ecosystem: string;
  license?: string;
  checksum?: string;
  direct: boolean;
}

export interface SbomDocument {
  format: "Sentinel-SBOM-1";
  generatedAt: string;
  sourceVersion: string;
  components: SoftwareComponent[];
  checksum: string;
}

export interface DependencyPolicy {
  deniedPackages: string[];
  deniedLicenses: string[];
  requireChecksums: boolean;
  allowUnpinnedVersions: boolean;
}

export interface DependencyPolicyResult {
  allowed: boolean;
  violations: string[];
}
