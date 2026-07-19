import { stat } from "node:fs/promises";
import fg from "fast-glob";
import { config } from "./config";

export async function assertRepositoryLimits(repositoryPath: string) {
  const files = await fg(["**/*"], {
    cwd: repositoryPath,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: [".git/**", "node_modules/**", ".next/**", "dist/**", "build/**"]
  });

  if (files.length > config.MAX_REPOSITORY_FILES) {
    throw new Error(`Repository exceeds file limit (${files.length}/${config.MAX_REPOSITORY_FILES})`);
  }

  let bytes = 0;
  for (const file of files) {
    const info = await stat(`${repositoryPath}/${file}`);
    bytes += info.size;
    if (bytes > config.MAX_REPOSITORY_BYTES) {
      throw new Error(`Repository exceeds size limit (${bytes}/${config.MAX_REPOSITORY_BYTES} bytes)`);
    }
  }

  return { files: files.length, bytes };
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
