import {
  loadLatestBackup
} from "@/lib/release-readiness";

export const dynamic = "force-dynamic";

export default async function BackupsPage() {
  const backup = await loadLatestBackup();

  return (
    <main className="system-stack">
      <section className="system-hero">
        <div>
          <p className="eyebrow">DISASTER RECOVERY</p>
          <h1>Local backups</h1>
          <p className="muted">
            Integrity-verified local backups for rollout and operations data.
          </p>
        </div>
      </section>

      <section className="system-card">
        <div className="system-card-head">
          <div>
            <p className="eyebrow">LATEST BACKUP</p>
            <h2>{backup ? backup.manifest.backupId : "No backup available"}</h2>
          </div>
          <a href="/api/system/backup">Backup API</a>
        </div>

        {backup ? (
          <div className="backup-summary">
            <div>
              <span>Created</span>
              <strong>
                {new Date(backup.manifest.createdAt).toLocaleString("en-US")}
              </strong>
            </div>
            <div>
              <span>Created by</span>
              <strong>{backup.manifest.createdBy}</strong>
            </div>
            <div>
              <span>Files</span>
              <strong>{backup.manifest.files.length}</strong>
            </div>
            <div>
              <span>Checksum</span>
              <strong>{backup.manifest.checksum.slice(0, 12)}…</strong>
            </div>
          </div>
        ) : (
          <p className="muted">
            Create the first backup using POST /api/system/backup.
          </p>
        )}
      </section>

      <section className="system-card">
        <p className="eyebrow">RECOVERY POLICY</p>
        <h2>Safe restore behavior</h2>
        <div className="recovery-grid">
          <article>
            <strong>Integrity verification</strong>
            <p>Manifest and every payload are verified before restore.</p>
          </article>
          <article>
            <strong>Path protection</strong>
            <p>Absolute paths and directory traversal are rejected.</p>
          </article>
          <article>
            <strong>No overwrite by default</strong>
            <p>Existing local state is preserved unless explicitly allowed.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
