import {
  getReadinessReport,
  getSystemDiagnostics
} from "@/lib/release-readiness";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  return `readiness-status ${status}`;
}

export default async function SystemPage() {
  const report = await getReadinessReport();
  const diagnostics = await getSystemDiagnostics();

  return (
    <main className="system-stack">
      <section className="system-hero">
        <div>
          <p className="eyebrow">PHASE 72 · RELEASE CANDIDATE</p>
          <h1>Production readiness</h1>
          <p className="muted">
            Runtime diagnostics, security checks, storage verification
            and release gating in one operating view.
          </p>
        </div>

        <div className={`readiness-score ${report.ready ? "ready" : "blocked"}`}>
          <strong>{report.score}</strong>
          <span>{report.ready ? "Release ready" : "Release blocked"}</span>
        </div>
      </section>

      <section className="system-grid">
        <article className="system-card">
          <div className="system-card-head">
            <div>
              <p className="eyebrow">RELEASE GATE</p>
              <h2>Readiness checks</h2>
            </div>
            <a href="/api/system/readiness">Readiness API</a>
          </div>

          <div className="readiness-list">
            {report.checks.map(check => (
              <div className="readiness-row" key={check.id}>
                <span className={statusClass(check.status)}>
                  {check.status}
                </span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.message}</p>
                </div>
                <small>{check.required ? "Required" : "Recommended"}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="system-card">
          <div className="system-card-head">
            <div>
              <p className="eyebrow">RUNTIME</p>
              <h2>Diagnostics</h2>
            </div>
            <a href="/api/system/diagnostics">Diagnostics API</a>
          </div>

          <dl className="diagnostic-grid">
            <div><dt>Node.js</dt><dd>{diagnostics.nodeVersion}</dd></div>
            <div><dt>Platform</dt><dd>{diagnostics.platform}</dd></div>
            <div><dt>Architecture</dt><dd>{diagnostics.architecture}</dd></div>
            <div><dt>Memory</dt><dd>{diagnostics.memoryMb} MB</dd></div>
            <div><dt>Uptime</dt><dd>{diagnostics.uptimeSeconds}s</dd></div>
            <div>
              <dt>Data directory</dt>
              <dd>
                {diagnostics.writableDataDirectory ? "Writable" : "Blocked"}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="system-card">
        <p className="eyebrow">SECURITY CONFIGURATION</p>
        <h2>Environment readiness</h2>
        <div className="environment-grid">
          {Object.entries(diagnostics.environment).map(([name, configured]) => (
            <div key={name}>
              <strong>{name}</strong>
              <span>{configured ? "Configured" : "Not configured"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
