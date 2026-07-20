import {
  currentHardeningStatus,
  readSecurityAudit
} from "@/lib/production-hardening";

export const dynamic = "force-dynamic";

export default async function SecurityHardeningPage() {
  const status = currentHardeningStatus();
  const audit = await readSecurityAudit(20);

  const checks = [
    ["Secure headers", status.secureHeaders],
    ["Rate limiting", status.rateLimiting],
    ["Audit logging", status.auditLogging],
    ["Cache policy", status.cachePolicy],
    ["Health endpoint", status.healthEndpoint],
    ["Accessibility baseline", status.accessibilityBaseline]
  ] as const;

  return (
    <main className="hardening-stack">
      <section className="hardening-hero">
        <div>
          <p className="eyebrow">PHASE 76 · PRODUCTION HARDENING</p>
          <h1>Security hardening status</h1>
          <p className="muted">
            Runtime safeguards, headers, request controls, auditability,
            cache discipline and accessibility protection.
          </p>
        </div>

        <div className={`hardening-score ${status.overall}`}>
          <strong>{status.overall}</strong>
          <span>production posture</span>
        </div>
      </section>

      <section className="hardening-grid">
        {checks.map(([label, enabled]) => (
          <article key={label}>
            <span className={enabled ? "status ok" : "status danger"}>
              {enabled ? "enabled" : "missing"}
            </span>
            <strong>{label}</strong>
          </article>
        ))}
      </section>

      <section className="hardening-card">
        <div className="hardening-card-head">
          <div>
            <p className="eyebrow">SECURITY AUDIT</p>
            <h2>Recent records</h2>
          </div>
          <a href="/api/security/audit">Audit API</a>
        </div>

        <div className="hardening-audit-list">
          {audit.length === 0 ? (
            <p className="muted">No audit records yet.</p>
          ) : audit.map((record: {
            id: string;
            actor: string;
            action: string;
            target: string;
            occurredAt: string;
          }) => (
            <div key={record.id}>
              <strong>{record.action}</strong>
              <span>{record.actor} → {record.target}</span>
              <small>
                {new Date(record.occurredAt).toLocaleString("en-US")}
              </small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
