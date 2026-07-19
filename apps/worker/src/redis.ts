import IORedis from "ioredis";
import { config } from "./config";

let connection: IORedis | undefined;

export function getRedisConnection() {
  connection ??= new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false
  });
  return connection;
}
