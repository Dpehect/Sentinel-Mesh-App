import {createHash} from "node:crypto";
import type {
  DataCategory,
  ExportManifest,
  GovernedRecord,
  RetentionPolicy
} from "./types.js";

export type {
  DataCategory,
  ExportManifest,
  GovernedRecord,
  RetentionPolicy
} from "./types.js";

export const defaultRetentionPolicies: RetentionPolicy[] = [
  {category:"temporary-repository", retainDays:1, legalHoldAllowed:false},
  {category:"integration-log", retainDays:30, legalHoldAllowed:true},
  {category:"scan-result", retainDays:180, legalHoldAllowed:true},
  {category:"finding", retainDays:365, legalHoldAllowed:true},
  {category:"report", retainDays:365, legalHoldAllowed:true},
  {category:"audit-event", retainDays:2555, legalHoldAllowed:true}
];

export function findRetentionPolicy(
  category: DataCategory,
  policies: RetentionPolicy[] = defaultRetentionPolicies
): RetentionPolicy {
  const policy = policies.find(item => item.category === category);
  if (!policy) throw new Error("RETENTION_POLICY_NOT_FOUND");
  return policy;
}

export function isDeletionEligible(
  record: GovernedRecord,
  now: Date,
  policies: RetentionPolicy[] = defaultRetentionPolicies
): boolean {
  const policy = findRetentionPolicy(record.category, policies);

  if (record.legalHold && policy.legalHoldAllowed) return false;

  const expiresAt =
    new Date(record.createdAt).getTime() +
    policy.retainDays * 24 * 60 * 60 * 1000;

  return now.getTime() >= expiresAt;
}

export function filterTenantRecords(
  records: GovernedRecord[],
  tenantId: string
): GovernedRecord[] {
  return records.filter(record => record.tenantId === tenantId);
}

export function createExportManifest(
  records: GovernedRecord[],
  tenantId: string,
  generatedAt = new Date().toISOString()
): ExportManifest {
  const tenantRecords = filterTenantRecords(records, tenantId)
    .sort((a, b) => a.id.localeCompare(b.id));

  const recordIds = tenantRecords.map(record => record.id);
  const checksum = createHash("sha256")
    .update(`${tenantId}|${generatedAt}|${recordIds.join("|")}`)
    .digest("hex");

  return {
    tenantId,
    generatedAt,
    recordIds,
    recordCount:recordIds.length,
    checksum
  };
}

export function verifyExportManifest(manifest: ExportManifest): boolean {
  const expected = createHash("sha256")
    .update(`${manifest.tenantId}|${manifest.generatedAt}|${manifest.recordIds.join("|")}`)
    .digest("hex");

  return expected === manifest.checksum &&
    manifest.recordCount === manifest.recordIds.length;
}
