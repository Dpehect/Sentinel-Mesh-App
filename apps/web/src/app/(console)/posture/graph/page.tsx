import {PostureGraph} from "@/components/posture-graph";
import {postureAttackPaths, postureGraph} from "@/lib/posture-demo";

export default function PostureGraphPage(){
  return <main className="page">
    <section className="hero-card">
      <div>
        <p className="eyebrow">Cloud Asset Graph</p>
        <h1>Reachability and identity context</h1>
        <p>Deterministic, repository-local correlation between exposure, workloads, services and permissions.</p>
      </div>
      <div className="score-orb"><strong>{postureAttackPaths.length}</strong><span>Attack paths</span></div>
    </section>

    <section className="panel">
      <div className="section-heading">
        <div><p className="eyebrow">Interactive topology</p><h2>Security graph</h2></div>
        <span className="pill">{postureGraph.nodes.length} nodes · {postureGraph.edges.length} edges</span>
      </div>
      <PostureGraph graph={postureGraph}/>
    </section>

    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">Prioritized reachability</p><h2>Attack paths</h2></div></div>
      <div className="finding-list">
        {postureAttackPaths.length===0
          ? <p>No externally reachable high-risk path detected.</p>
          : postureAttackPaths.map(path=><article className="finding-row" key={path.id}>
              <div><span className="severity critical">score {path.score}</span><h3>{path.title}</h3></div>
              <div><p>{path.nodeIds.join(" → ")}</p><small>{path.edgeIds.length} correlated relationships</small></div>
              <div><strong>Why it matters</strong><p>{path.explanation.join(" ")}</p></div>
            </article>)}
      </div>
    </section>
  </main>
}
