import { Worker, type Job } from "bullmq";
import { simpleGit } from "simple-git";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanRepository } from "@sentinel/scanner-runner";
import { config } from "./config";
import { assertRepositoryLimits, withTimeout } from "./limits";
import { deadLetterQueue, type ScanJobData, type ScanJobResult } from "./queue";
import { getRedisConnection } from "./redis";

async function writeProgress(job: Job<ScanJobData>, progress: number, stage: string, message: string) {
  await job.updateProgress({ progress, stage });
  await job.log(message);
}

async function processScan(job: Job<ScanJobData, ScanJobResult>): Promise<ScanJobResult> {
  let directory = "";
  const { repositoryUrl, projectId } = job.data;

  try {
    await writeProgress(job, 5, "preparing", `Preparing isolated workspace for ${repositoryUrl}`);
    directory = await mkdtemp(join(tmpdir(), "sentinel-scan-"));

    await writeProgress(job, 12, "cloning", "Cloning repository with shallow history");
    await withTimeout(
      simpleGit().clone(repositoryUrl, directory, ["--depth", "1", "--single-branch", "--no-tags"]),
      config.CLONE_TIMEOUT_MS,
      "Repository clone"
    );

    await writeProgress(job, 22, "validating", "Checking repository file and disk limits");
    const inventory = await assertRepositoryLimits(directory);
    await job.log(`Repository accepted: ${inventory.files} files, ${inventory.bytes} bytes`);

    await writeProgress(job, 30, "scanning", "Starting scanner pipeline");
    let scannerProgress = 30;
    const result = await withTimeout(
      scanRepository(directory, repositoryUrl, async (line) => {
        scannerProgress = Math.min(92, scannerProgress + 5);
        await job.updateProgress({ progress: scannerProgress, stage: "scanning" });
        await job.log(line);
      }),
      config.SCAN_TIMEOUT_MS,
      "Security scan"
    );

    await writeProgress(job, 96, "finalizing", "Finalizing normalized findings and attack paths");
    return {
      result,
      projectId,
      repositoryUrl,
      completedAt: new Date().toISOString()
    };
  } finally {
    if (directory) {
      await rm(directory, { recursive: true, force: true });
      await job.log("Temporary scan workspace removed");
    }
  }
}

export const scanWorker = new Worker<ScanJobData, ScanJobResult>(config.SCAN_QUEUE_NAME, processScan, {
  connection: getRedisConnection(),
  concurrency: config.SCAN_CONCURRENCY,
  lockDuration: Math.min(config.SCAN_TIMEOUT_MS + 60_000, 30 * 60_000),
  stalledInterval: 30_000,
  maxStalledCount: 1
});

scanWorker.on("completed", async (job) => {
  await job.log("Scan completed successfully");
});

scanWorker.on("failed", async (job, error) => {
  if (!job) return;
  await job.log(`Attempt ${job.attemptsMade}/${job.opts.attempts ?? 1} failed: ${error.message}`);
  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await deadLetterQueue.add("failed-repository-scan", {
      originalJobId: job.id,
      data: job.data,
      failedReason: error.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString()
    }, { removeOnComplete: false, removeOnFail: false });
  }
});

scanWorker.on("error", (error) => {
  console.error("Scan worker error", error);
});
