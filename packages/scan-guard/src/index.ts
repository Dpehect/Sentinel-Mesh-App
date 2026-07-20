import path from "node:path";
import type {ScanCandidate, ScanGuardResult, ScanLimits} from "./types.js";

export type {ScanCandidate, ScanGuardResult, ScanLimits};

export const defaultScanLimits: ScanLimits = {
  maxFiles: 20000,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 250 * 1024 * 1024,
  maxPathLength: 240,
  timeoutMs: 5 * 60 * 1000,
  allowedExtensions: [
    ".js", ".jsx", ".ts", ".tsx", ".json", ".yaml", ".yml",
    ".py", ".java", ".kt", ".go", ".rs", ".php", ".rb",
    ".tf", ".hcl", ".xml", ".sql", ".md", ".txt"
  ]
};

function isUnsafePath(candidatePath: string): boolean {
  const normalized = path.posix.normalize(candidatePath.replaceAll("\\", "/"));
  return (
    normalized.startsWith("../") ||
    normalized === ".." ||
    normalized.startsWith("/") ||
    normalized.includes("/../")
  );
}

export function guardScanCandidates(
  candidates: ScanCandidate[],
  limits: ScanLimits = defaultScanLimits
): ScanGuardResult {
  const accepted: ScanCandidate[] = [];
  const rejected: ScanGuardResult["rejected"] = [];
  let totalBytes = 0;

  for (const candidate of candidates) {
    if (accepted.length >= limits.maxFiles) {
      rejected.push({candidate, reason:"MAX_FILE_COUNT_EXCEEDED"});
      continue;
    }

    if (candidate.isSymbolicLink) {
      rejected.push({candidate, reason:"SYMLINK_NOT_ALLOWED"});
      continue;
    }

    if (candidate.path.length > limits.maxPathLength || isUnsafePath(candidate.path)) {
      rejected.push({candidate, reason:"UNSAFE_PATH"});
      continue;
    }

    if (candidate.sizeBytes < 0 || candidate.sizeBytes > limits.maxFileBytes) {
      rejected.push({candidate, reason:"FILE_SIZE_LIMIT_EXCEEDED"});
      continue;
    }

    const extension = path.extname(candidate.path).toLowerCase();
    if (!limits.allowedExtensions.includes(extension)) {
      rejected.push({candidate, reason:"EXTENSION_NOT_ALLOWED"});
      continue;
    }

    if (totalBytes + candidate.sizeBytes > limits.maxTotalBytes) {
      rejected.push({candidate, reason:"TOTAL_SIZE_LIMIT_EXCEEDED"});
      continue;
    }

    accepted.push(candidate);
    totalBytes += candidate.sizeBytes;
  }

  return {accepted, rejected, totalBytes};
}

export async function withScanTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = defaultScanLimits.timeoutMs
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}
