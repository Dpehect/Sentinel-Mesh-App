import { getLatestResult } from "@/lib/data";
export const dynamic = "force-dynamic";

export default async function Findings(){
  const result=await getLatestResult();
  const astCount=result.findings.filter(f=>f.scanner==="sentinel-ast").length;
  const mapped=result.findings.filter(f=>f.cwe||f.owasp).length;
  return <>
    <div className="eyebrow">Security intelligence engine</div>
    <h1 className="title">Correlated findings</h1>
    <p className="subtitle">AST source-to-sink evidence combined with deterministic, SAST, secret and dependency scanners.</p>
    <section className="metrics grid" style={{marginTop:24}}>
      {[["Total findings",result.findings.length],["AST findings",astCount],["CWE / OWASP mapped",mapped],["Security score",result.score]].map(([label,value])=><div className="card" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div>)}
    </section>
    <div className="card table-wrap" style={{marginTop:24}}><table className="table"><thead><tr><th>Severity</th><th>Finding</th><th>Standard</th><th>Scanner</th><th>Evidence</th><th>Confidence</th></tr></thead><tbody>{result.findings.map(f=><tr key={f.id}>
      <td className={f.severity}>{f.severity.toUpperCase()}</td>
      <td><strong>{f.title}</strong><div className="muted">{f.description}</div>{f.remediation&&<div style={{marginTop:8,fontSize:12}}><strong>Fix:</strong> {f.remediation}</div>}</td>
      <td><div>{f.cwe??"—"}</div><div className="muted">{f.owasp??"Unmapped"}</div></td>
      <td>{f.scanner}</td>
      <td>{f.evidence[0]?.file}:{f.evidence[0]?.line}<div className="muted" style={{maxWidth:280,whiteSpace:"normal"}}>{f.evidence[0]?.excerpt}</div></td>
      <td>{Math.round(f.confidence*100)}%</td>
    </tr>)}</tbody></table></div>
  </>;
}
