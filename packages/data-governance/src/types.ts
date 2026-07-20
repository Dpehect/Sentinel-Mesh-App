export type DataCategory =
  | "scan-result"
  | "finding"
  | "audit-event"
  | "report"
  | "temporary-repository"
  | "integration-log";

export interface RetentionPolicy {
  category: DataCategory;
  retainDays: number;
  legalHoldAllowed: boolean;
}

export interface GovernedRecord {
  id: string;
  tenantId: string;
  category: DataCategory;
  createdAt: string;
  legalHold?: boolean;
}

export interface ExportManifest {
  tenantId: string;
  generatedAt: string;
  recordIds: string[];
  recordCount: number;
  checksum: string;
}
