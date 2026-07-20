import {
  ensureDemoRollout,
  rolloutControlPlane
} from "@/lib/rollout-control";

export const dynamic = "force-dynamic";

function badgeClass(state: string): string {
  if (state === "completed" || state === "approved") return "status ok";
  if (state === "failed" || state === "rolling-back") return "status danger";
  if (state === "paused" || state === "awaiting-approval") return "status warn";
  return "status";
}

export default async function RolloutsPage() {
  await ensureDemoRollout();
  const rollouts = await rolloutControlPlane.list();

  return (
    <main className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">PHASE 70 · PRODUCTION CONTROL</p>
          <h1>Agent rollout control plane</h1>
          <p className="muted">
            Approval gates, optimistic concurrency, atomic persistence,
            recovery checkpoints and auditable state transitions.
          </p>
        </div>
        <div className="metric">
          <strong>{rollouts.length}</strong>
          <span>tracked rollouts</span>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACTIVE OPERATIONS</p>
            <h2>Fleet deployments</h2>
          </div>
          <a className="button-link" href="/api/rollouts">
            JSON API
          </a>
        </div>

        <div className="rollout-grid">
          {rollouts.map((rollout) => (
            <article className="rollout-card" key={rollout.rolloutId}>
              <div className="rollout-card-head">
                <div>
                  <h3>{rollout.rolloutId}</h3>
                  <p>{rollout.operation}</p>
                </div>
                <span className={badgeClass(rollout.state)}>
                  {rollout.state}
                </span>
              </div>

              <dl className="detail-grid">
                <div>
                  <dt>Version</dt>
                  <dd>{rollout.version}</dd>
                </div>
                <div>
                  <dt>Active wave</dt>
                  <dd>{rollout.activeWave ?? "Not started"}</dd>
                </div>
                <div>
                  <dt>Approval</dt>
                  <dd>
                    {rollout.approvalRequired
                      ? rollout.approvedBy ?? "Required"
                      : "Not required"}
                  </dd>
                </div>
                <div>
                  <dt>Checkpoint</dt>
                  <dd>{rollout.checkpointId ? "Available" : "None"}</dd>
                </div>
              </dl>

              <div className="wave-list">
                {rollout.waves.map((wave) => (
                  <div className="wave-row" key={wave.wave}>
                    <span>Wave {wave.wave}</span>
                    <b>{wave.plannedAgents} agents</b>
                    <small>{wave.state}</small>
                  </div>
                ))}
              </div>

              <p className="card-footnote">
                Updated {new Date(rollout.updatedAt).toLocaleString("en-US")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card">
        <p className="eyebrow">OPERATING MODEL</p>
        <h2>Safe by default</h2>
        <div className="principle-grid">
          <article>
            <strong>Atomic persistence</strong>
            <p>State files are written through a temporary file and rename.</p>
          </article>
          <article>
            <strong>Version guards</strong>
            <p>Stale operators cannot overwrite a newer rollout decision.</p>
          </article>
          <article>
            <strong>Recovery checkpoints</strong>
            <p>Verified snapshots restore a rollout into a paused state.</p>
          </article>
          <article>
            <strong>Approval controls</strong>
            <p>Production rollouts can require explicit security approval.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
