import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export const dynamic = "force-dynamic";

function severityClass(severity: string): string {
  if (severity === "critical") return "severity critical";
  if (severity === "high") return "severity high";
  if (severity === "medium") return "severity medium";
  return "severity low";
}

function healthClass(status: string): string {
  return `health-pill ${status}`;
}

export default async function OperationsPage() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();
  const healthSummary = await operationsCenter.healthSummary();
  const notifications = await operationsCenter.deriveNotifications();

  const openIncidents = snapshot.incidents.filter(
    incident => incident.status !== "resolved"
  );

  return (
    <main className="ops-stack">
      <section className="ops-hero">
        <div>
          <p className="eyebrow">PHASE 71 · OPERATIONS CENTER</p>
          <h1>Security operations command center</h1>
          <p className="muted">
            Incidents, health telemetry, notification rules and team access
            in one local-first operating surface.
          </p>
        </div>

        <div className="ops-summary-grid">
          <div>
            <strong>{openIncidents.length}</strong>
            <span>open incidents</span>
          </div>
          <div>
            <strong>{notifications.length}</strong>
            <span>active alerts</span>
          </div>
          <div>
            <strong>{snapshot.members.length}</strong>
            <span>team members</span>
          </div>
          <div>
            <strong>{healthSummary.overall}</strong>
            <span>system health</span>
          </div>
        </div>
      </section>

      <section className="ops-two-column">
        <article className="ops-card">
          <div className="ops-card-head">
            <div>
              <p className="eyebrow">INCIDENT QUEUE</p>
              <h2>Active investigations</h2>
            </div>
            <a href="/api/operations/incidents">JSON API</a>
          </div>

          <div className="incident-table">
            {snapshot.incidents.map(incident => (
              <div className="incident-row" key={incident.incidentId}>
                <span className={severityClass(incident.severity)}>
                  {incident.severity}
                </span>
                <div>
                  <strong>{incident.title}</strong>
                  <p>{incident.source} · {incident.status}</p>
                </div>
                <small>v{incident.version}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-card">
          <div className="ops-card-head">
            <div>
              <p className="eyebrow">PLATFORM HEALTH</p>
              <h2>Component status</h2>
            </div>
            <a href="/api/operations/health">Health API</a>
          </div>

          <div className="health-list">
            {snapshot.health.map(item => (
              <div className="health-row" key={item.component}>
                <div>
                  <strong>{item.component}</strong>
                  <p>{item.details}</p>
                </div>
                <div>
                  <span className={healthClass(item.status)}>
                    {item.status}
                  </span>
                  <small>{item.latencyMs} ms</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="ops-two-column">
        <article className="ops-card">
          <div className="ops-card-head">
            <div>
              <p className="eyebrow">NOTIFICATION POLICY</p>
              <h2>Alert rules</h2>
            </div>
            <a href="/api/operations/rules">Rules API</a>
          </div>

          <div className="rule-list">
            {snapshot.rules.map(rule => (
              <div className="rule-row" key={rule.ruleId}>
                <div>
                  <strong>{rule.name}</strong>
                  <p>
                    {rule.severities.join(", ")} · {rule.channels.join(", ")}
                  </p>
                </div>
                <span>{rule.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ops-card">
          <div className="ops-card-head">
            <div>
              <p className="eyebrow">TEAM ACCESS</p>
              <h2>Operations members</h2>
            </div>
            <a href="/team">Manage team</a>
          </div>

          <div className="member-list">
            {snapshot.members.map(member => (
              <div className="member-row" key={member.memberId}>
                <div>
                  <strong>{member.displayName}</strong>
                  <p>{member.email}</p>
                </div>
                <span>{member.role}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
