import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { config } from "./config";
import { enqueueScan, scanQueue } from "./queue";
import { getRedisConnection } from "./redis";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const inputSchema = z.object({
  repositoryUrl: z.string().url().refine((value) => /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?$/.test(value), "Only public GitHub repository URLs are accepted"),
  projectId: z.string().uuid().optional()
});

function serializeProgress(progress: unknown) {
  if (typeof progress === "number") return { progress, stage: "processing" };
  if (progress && typeof progress === "object") return progress as { progress?: number; stage?: string };
  return { progress: 0, stage: "queued" };
}

async function jobPayload(id: string) {
  const job = await scanQueue.getJob(id);
  if (!job) return null;
  const [state, logResult] = await Promise.all([job.getState(), scanQueue.getJobLogs(id, 0, 250, true)]);
  const progress = serializeProgress(job.progress);
  const publicStatus = state === "completed" ? "complete" : state === "active" ? "scanning" : state === "waiting" || state === "delayed" ? "queued" : state;
  return {
    id: job.id,
    projectId: job.data.projectId,
    repositoryUrl: job.data.repositoryUrl,
    requestId: job.data.requestId,
    status: publicStatus,
    progress: progress.progress ?? 0,
    stage: progress.stage ?? state,
    attemptsMade: job.attemptsMade,
    maxAttempts: job.opts.attempts ?? 1,
    createdAt: new Date(job.timestamp).toISOString(),
    processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
    completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    logs: logResult.logs,
    result: job.returnvalue?.result,
    error: job.failedReason || undefined
  };
}

app.get("/health", async (_request, reply) => {
  try {
    const pong = await getRedisConnection().ping();
    const counts = await scanQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    return { status: pong === "PONG" ? "ok" : "degraded", service: "scanner-worker", queue: config.SCAN_QUEUE_NAME, counts };
  } catch (error) {
    return reply.code(503).send({ status: "unhealthy", service: "scanner-worker", error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/jobs", async () => {
  const jobs = await scanQueue.getJobs(["waiting", "active", "delayed", "completed", "failed"], 0, 49, false);
  return Promise.all(jobs.map((job) => jobPayload(String(job.id))));
});

app.get("/jobs/:id", async (request, reply) => {
  const id = (request.params as { id: string }).id;
  const payload = await jobPayload(id);
  return payload ?? reply.code(404).send({ error: "Job not found" });
});

app.get("/jobs/:id/events", async (request, reply) => {
  const id = (request.params as { id: string }).id;
  const job = await scanQueue.getJob(id);
  if (!job) return reply.code(404).send({ error: "Job not found" });

  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  let closed = false;
  request.raw.on("close", () => { closed = true; });

  while (!closed) {
    const payload = await jobPayload(id);
    if (!payload) break;
    reply.raw.write(`event: scan\ndata: ${JSON.stringify(payload)}\n\n`);
    if (["complete", "failed"].includes(payload.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  reply.raw.end();
});

app.post("/jobs", async (request, reply) => {
  const parsed = inputSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const job = await enqueueScan(parsed.data);
  return reply.code(202).send(await jobPayload(String(job.id)));
});

app.post("/jobs/:id/retry", async (request, reply) => {
  const id = (request.params as { id: string }).id;
  const job = await scanQueue.getJob(id);
  if (!job) return reply.code(404).send({ error: "Job not found" });
  if (await job.getState() !== "failed") return reply.code(409).send({ error: "Only failed jobs can be retried" });
  await job.retry("failed");
  return reply.code(202).send(await jobPayload(id));
});

export async function startServer() {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
}
