import {
  ensureOperationsDemo,
  operationsCenter
} from "@/lib/operations-center";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await ensureOperationsDemo();
  const snapshot = await operationsCenter.overview();

  return (
    <main className="ops-stack">
      <section className="ops-hero">
        <div>
          <p className="eyebrow">ACCESS GOVERNANCE</p>
          <h1>Team and role management</h1>
          <p className="muted">
            Local-first role assignments for Sentinel Mesh operations.
          </p>
        </div>
      </section>

      <section className="ops-card">
        <div className="ops-card-head">
          <div>
            <p className="eyebrow">MEMBERS</p>
            <h2>Current access</h2>
          </div>
          <a href="/api/operations/members">Members API</a>
        </div>

        <div className="team-grid">
          {snapshot.members.map(member => (
            <article className="team-card" key={member.memberId}>
              <strong>{member.displayName}</strong>
              <p>{member.email}</p>
              <span>{member.role}</span>
              <small>{member.active ? "Active" : "Disabled"}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
