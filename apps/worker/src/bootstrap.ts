import "./processor";
import { startServer } from "./server";
import { scanQueue, scanQueueEvents } from "./queue";
import { scanWorker } from "./processor";
import { getRedisConnection } from "./redis";

await startServer();

async function shutdown(signal: string) {
  console.log(`Received ${signal}; closing queue services`);
  await Promise.allSettled([scanWorker.close(), scanQueueEvents.close(), scanQueue.close()]);
  await getRedisConnection().quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
