import {postureDemo} from "../../../lib/posture-demo";

const tone=(severity:string)=>severity==="critical"?"#ff6b6b":severity==="high"?"#ffb454":severity==="medium"?"#ffd166":"#8bd3dd";

export default function PosturePage(){
  const report=postureDemo;
  const cards=[
    ["Overall posture",report.score],["Kubernetes",report.kubernetesScore],["Cloud & IaC",report.cloudScore],["Attack paths",report.attackPaths.length]
  ];
  return <main style={{display:"grid",gap:24}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:24,flexWrap:"wrap"}}>
      <div><p style={{letterSpacing:".14em",textTransform:"uppercase",opacity:.65,fontSize:12}}>Phase 11A · Local-first</p><h1 style={{fontSize:"clamp(2rem,5vw,4.5rem)",margin:"6px 0"}}>Cloud & Kubernetes Posture</h1><p style={{maxWidth:760,opacity:.76}}>Offline posture intelligence for Kubernetes manifests, Terraform, CloudFormation and Docker Compose. No account, API key or paid cloud connection required.</p></div>
      <div style={{padding:"14px 18px",border:"1px solid rgba(255,255,255,.12)",borderRadius:18,background:"rgba(255,255,255,.04)"}}>Rules loaded <strong>{23}</strong></div>
    </header>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14}}>
      {cards.map(([label,value])=><article key={String(label)} style={{padding:20,borderRadius:20,border:"1px solid rgba(255,255,255,.1)",background:"linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))"}}><p style={{margin:0,opacity:.65}}>{label}</p><strong style={{display:"block",fontSize:36,marginTop:12}}>{value}{label!=="Attack paths"?"%":""}</strong></article>)}
    </section>
    <section style={{display:"grid",gridTemplateColumns:"minmax(0,1.35fr) minmax(280px,.65fr)",gap:18}}>
      <article style={{padding:22,borderRadius:22,border:"1px solid rgba(255,255,255,.1)",overflow:"hidden"}}><h2>Priority findings</h2><div style={{display:"grid",gap:10}}>{report.findings.slice(0,8).map(f=><div key={f.id} style={{display:"grid",gridTemplateColumns:"100px 1fr auto",gap:14,alignItems:"center",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}><span style={{color:tone(f.severity),fontWeight:800,textTransform:"uppercase",fontSize:12}}>{f.severity}</span><div><strong>{f.title}</strong><p style={{margin:"5px 0 0",opacity:.62,fontSize:13}}>{f.source} · {f.evidence}</p></div><span style={{fontVariantNumeric:"tabular-nums"}}>{f.riskScore}</span></div>)}</div></article>
      <article style={{padding:22,borderRadius:22,border:"1px solid rgba(255,255,255,.1)"}}><h2>Exposure chain</h2>{report.attackPaths.map(path=><div key={path.id}><p style={{opacity:.7}}>{path.explanation}</p><div style={{display:"grid",gap:8}}>{path.nodes.map((node,i)=><div key={`${node}-${i}`} style={{padding:"11px 13px",borderRadius:12,background:"rgba(255,255,255,.055)",borderLeft:i===0?"3px solid #ff6b6b":"3px solid rgba(139,211,221,.7)"}}>{node}</div>)}</div></div>)}</article>
    </section>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>{report.assets.map(asset=><article key={asset.id} style={{padding:18,borderRadius:18,border:"1px solid rgba(255,255,255,.1)"}}><p style={{textTransform:"uppercase",fontSize:11,letterSpacing:".12em",opacity:.6}}>{asset.provider} · {asset.kind}</p><h3>{asset.name}</h3><p style={{opacity:.68}}>{asset.source}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{asset.internetExposed&&<span style={{padding:"6px 9px",borderRadius:999,background:"rgba(255,107,107,.14)",color:"#ff8a8a"}}>Internet exposed</span>}{asset.privileged&&<span style={{padding:"6px 9px",borderRadius:999,background:"rgba(255,180,84,.14)",color:"#ffc078"}}>Privileged</span>}</div></article>)}</section>
  </main>;
}
