import { scanPublicGithubRepository, type ScanProgress } from "@sentinel/scanner-runner";
import { scoreScan, type ScanResult, type ScanScore } from "@sentinel/security-core";

export type ScanJob = {
  id: string;
  repositoryUrl: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: ScanProgress["stage"];
  logs: Array<{ at: string; message: string }>;
  createdAt: string;
  result?: ScanResult & { score: ScanScore; scannerStatus: Record<string, "active" | "unavailable" | "completed"> };
  error?: string;
};

const globalJobs = globalThis as typeof globalThis & { __sentinelJobs?: Map<string, ScanJob> };
const jobs = globalJobs.__sentinelJobs ?? new Map<string, ScanJob>();
globalJobs.__sentinelJobs = jobs;

function log(job: ScanJob, message: string) { job.logs.push({ at: new Date().toISOString(), message }); }

export function createScanJob(repositoryUrl: string) {
  const id = crypto.randomUUID();
  const job: ScanJob = { id, repositoryUrl, status: "queued", progress: 2, stage: "queued", logs: [], createdAt: new Date().toISOString() };
  log(job, "Scan accepted and queued");
  jobs.set(id, job);
  void run(job);
  return job;
}

async function run(job: ScanJob) {
  job.status = "running";
  try {
    const result = await scanPublicGithubRepository(job.repositoryUrl, (event) => {
      job.stage = event.stage;
      job.progress = event.progress;
      log(job, event.message);
    });
    job.result = { ...result, score: scoreScan(result.findings, result.assets) };
    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.stage = "failed";
    job.error = error instanceof Error ? error.message : "Scan failed";
    log(job, job.error);
  }
}

export function getScanJob(id: string) { return jobs.get(id); }
