import Link from "next/link";
import { getFinalStatus } from "@/lib/final-status";

export const dynamic = "force-dynamic";

function checkClass(status: string) {
  return `final-check-state ${status}`;
}

export default async function CommandCenterPage() {
  const status = await getFinalStatus();

  const primaryCapabilities = status.capabilities.slice(0, 12);

  return (
    <main className="final-stack">
      <section className="final-hero">
        <div>
          <p className="eyebrow">SENTINEL MESH 10.0</p>
          <h1>Unified security control plane</h1>
          <p className="muted">
            Local-first scanning, evidence-aware intelligence, attack-path
            analysis, agent fleet operations and release governance.
          </p>
          <div className="final-hero-actions">
            <Link href="/scans">Launch scan</Link>
            <Link href="/operations">Open operations</Link>
            <Link href="/system">Verify system</Link>
          </div>
        </div>

        <div className={`final-score ${status.ready ? "ready" : "blocked"}`}>
          <strong>{status.score}</strong>
          <span>{status.ready ? "Production ready" : "Action required"}</span>
          <small>Version {status.version}</small>
        </div>
      </section>

      <section className="final-metrics">
        <article>
          <strong>{status.capabilities.length}</strong>
          <span>integrated capabilities</span>
        </article>
        <article>
          <strong>
            {status.checks.filter(item => item.status === "pass").length}
          </strong>
          <span>checks passed</span>
        </article>
        <article>
          <strong>
            {status.checks.filter(item => item.status === "warn").length}
          </strong>
          <span>recommendations</span>
        </article>
        <article>
          <strong>
            {status.checks.filter(item => item.status === "fail").length}
          </strong>
          <span>failed checks</span>
        </article>
      </section>

      <section className="final-two-column">
        <article className="final-card">
          <div className="final-card-head">
            <div>
              <p className="eyebrow">FINAL VERIFICATION</p>
              <h2>Product checks</h2>
            </div>
            <Link href="/api/final/status">Status API</Link>
          </div>

          <div className="final-check-list">
            {status.checks.map(check => (
              <div className="final-check-row" key={check.id}>
                <span className={checkClass(check.status)}>
                  {check.status}
                </span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.message}</p>
                </div>
                <small>{check.blocking ? "Blocking" : check.category}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="final-card">
          <p className="eyebrow">PRODUCT SURFACE</p>
          <h2>Integrated capabilities</h2>
          <div className="final-capability-grid">
            {primaryCapabilities.map(capability => (
              <div key={capability}>{capability}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="final-card">
        <p className="eyebrow">OPERATING PATHS</p>
        <h2>Core workflows</h2>
        <div className="final-workflow-grid">
          <Link href="/findings">
            <strong>Investigate</strong>
            <span>Review evidence-backed findings</span>
          </Link>
          <Link href="/attack-paths">
            <strong>Prioritize</strong>
            <span>Analyze reachable attack paths</span>
          </Link>
          <Link href="/rollouts">
            <strong>Deploy</strong>
            <span>Control agent rollout waves</span>
          </Link>
          <Link href="/operations">
            <strong>Respond</strong>
            <span>Manage incidents and platform health</span>
          </Link>
          <Link href="/backups">
            <strong>Recover</strong>
            <span>Verify backup and restore readiness</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
