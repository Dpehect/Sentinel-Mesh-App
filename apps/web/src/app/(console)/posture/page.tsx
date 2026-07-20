import {postureDemo} from "@/lib/posture-demo";

const severityOrder=["critical","high","medium","low","info"] as const;

export default function PosturePage(){
  return <main className="page">
    <section className="hero-card">
      <div>
        <p className="eyebrow">Cloud & Kubernetes Security</p>
        <h1>Posture Intelligence</h1>
        <p>Offline-first infrastructure analysis. No cloud account, API key, or source upload required.</p><p><a href="/posture/graph">Open cloud asset graph →</a></p>
      </div>
      <div className="score-orb"><strong>{postureDemo.score}</strong><span>Security score</span></div>
    </section>

    <section className="metric-grid">
      <article className="metric-card"><span>Assets</span><strong>{postureDemo.assets.length}</strong></article>
      {severityOrder.slice(0,4).map(level=>
        <article className="metric-card" key={level}><span>{level}</span><strong>{postureDemo.summary[level]}</strong></article>
      )}
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Prioritized evidence</p><h2>Active misconfigurations</h2></div><span className="pill">{postureDemo.findings.length} findings</span></div>
      <div className="finding-list">
        {postureDemo.findings.map(finding=><article className="finding-row" key={finding.id}>
          <div><span className={`severity ${finding.severity}`}>{finding.severity}</span><h3>{finding.title}</h3><p>{finding.source}</p></div>
          <div><p>{finding.evidence[0]}</p><small>{finding.standards.join(" · ")}</small></div>
          <div><strong>Remediation</strong><p>{finding.remediation}</p></div>
        </article>)}
      </div>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Inventory</p><h2>Discovered assets</h2></div></div>
      <div className="asset-grid">{postureDemo.assets.map(asset=><article className="asset-card" key={asset.id}>
        <span>{asset.provider}</span><h3>{asset.name}</h3><p>{asset.kind}</p><code>{asset.id}</code>
      </article>)}</div>
    </section>
  </main>
}
