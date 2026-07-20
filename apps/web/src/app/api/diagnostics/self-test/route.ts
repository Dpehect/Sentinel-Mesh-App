import { access } from "node:fs/promises";
import path from "node:path";
import { ok } from "@/lib/api-response";

async function exists(relativePath: string): Promise<boolean> {
  try {
    await access(path.join(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const checks = await Promise.all([
    ["root-package", "package.json"],
    ["web-package", "apps/web/package.json"],
    ["worker-package", "apps/worker/package.json"],
    ["command-center", "apps/web/src/app/(console)/command-center/page.tsx"],
    ["operations", "apps/web/src/app/(console)/operations/page.tsx"],
    ["rollouts", "apps/web/src/app/(console)/rollouts/page.tsx"],
    ["system", "apps/web/src/app/(console)/system/page.tsx"],
    ["final-integration", "packages/final-integration/package.json"]
  ].map(async ([id, file]) => ({
    id,
    file,
    present: await exists(file)
  })));

  const failed = checks.filter(check => !check.present);

  return ok({
    ready: failed.length === 0,
    checks,
    failed: failed.map(item => item.id)
  }, {
    status: failed.length === 0 ? 200 : 503
  });
}
