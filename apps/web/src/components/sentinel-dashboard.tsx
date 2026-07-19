"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { SecurityMesh } from "./security-mesh";
import type { ScanResult, ScanScore } from "@sentinel/security-core";

type ApiResult = ScanResult & { score: ScanScore };
const initialLogs = ["Initializing isolated scan workspace", "Waiting for repository target"];

export function SentinelDashboard() {
  const [repositoryUrl,setRepositoryUrl]=useState("https://github.com/vercel/next.js");
  const [result,setResult]=useState<ApiResult|null>(null);
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState("");
  const [logs,setLogs]=useState(initialLogs);

  async function scan(event:FormEvent){
    event.preventDefault(); setError(""); setLoading(true); setResult(null); setProgress(12);
    const sequence=[[30,"Cloning metadata into ephemeral sandbox"],[48,"Normalizing scanner output"],[68,"Building asset relation graph"],[86,"Calculating contextual attack paths"]] as const;
    setLogs(["Scan requested",`Target: ${repositoryUrl}`]);
    const timers=sequence.map(([p,msg],i)=>setTimeout(()=>{setProgress(p);setLogs(v=>[...v,msg]);},350*(i+1)));
    try {
      const response=await fetch("/api/scans",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repositoryUrl})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data); setProgress(100); setLogs(v=>[...v,"Attack graph compiled","Scan completed successfully"]);
    } catch(e){ setError(e instanceof Error?e.message:"Scan failed"); setProgress(0); }
    finally { timers.forEach(clearTimeout); setLoading(false); }
  }

  const metrics=useMemo(()=>[
    ["Security score",result?.score.overall ?? 92],["Open findings",result?.findings.length ?? 0],["Attack paths",result?.attackPaths.length ?? 0],["Assets mapped",result?.assets.length ?? 5],
  ],[result]);

  return <div className="shell"><div className="grid-bg"/><nav className="nav"><div className="brand"><span className="brand-mark"><ShieldCheck size={19}/></span>Sentinel Mesh</div><div className="status"><i/>Local-first engine online</div></nav>
    <main>
      <section className="hero">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
          <div className="eyebrow">Software security intelligence</div>
          <h1>See the breach before it happens.</h1>
          <p className="lede">Transform repositories into a living attack graph. Sentinel Mesh correlates code, dependencies, infrastructure and exposure into contextual, actionable security intelligence—without paid AI APIs.</p>
          <form className="scan-form" onSubmit={scan}><input aria-label="Public GitHub repository URL" value={repositoryUrl} onChange={e=>setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository"/><button className="primary" disabled={loading}>{loading?"Scanning…":"Run security scan"}</button></form>
          {error&&<div className="error">{error}</div>}
        </motion.div>
        <motion.div className="hero-visual" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.9,delay:.12}}>
          <div className="canvas-wrap"><SecurityMesh active={loading||!!result}/></div><div className="scan-overlay"><span className="chip">LIVE ATTACK SURFACE</span><span className="chip">WEBGL / LOCAL</span></div>
        </motion.div>
      </section>

      <section className="section"><div className="section-head"><div><div className="eyebrow">Command center</div><h2>Context, not scanner noise.</h2></div><p>Phase 1 proves the complete product loop with a framework-independent risk engine and a dynamic security interface. Real scanner workers replace the simulator in Phase 2.</p></div>
        <div className="metrics">{metrics.map(([label,value],i)=><motion.div className="metric" key={label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.08*i}}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></motion.div>)}</div>
        <div className="content-grid">
          <div className="panel"><div className="panel-title"><strong>Prioritized findings</strong><Radar size={18}/></div>
            <AnimatePresence mode="popLayout">{result?result.findings.map((f,i)=><motion.div className="finding" key={f.id} initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:.06*i}}><div className={`severity ${f.severity}`}>{f.severity.toUpperCase()}</div><div><strong>{f.title}</strong><p>{f.filePath}:{f.startLine} · {f.category} · confidence {Math.round(f.confidence*100)}%</p></div><div>{f.riskScore}</div></motion.div>):<div className="empty">Run the demo scan to populate normalized findings and trace the resulting attack path.</div>}</AnimatePresence>
          </div>
          <div className="panel"><div className="panel-title"><strong>Risk posture</strong><Activity size={18}/></div><div className="score-ring" style={{"--score":result?.score.overall??92} as React.CSSProperties}><span>{result?.score.overall??92}</span></div><div className="metric-label">Scan progress</div><div className="progress"><div style={{width:`${progress}%`}}/></div><div className="log" aria-live="polite">{logs.slice(-6).map((log,i)=><div key={`${log}-${i}`}><b>{String(i+1).padStart(2,"0")}</b> {log}</div>)}</div></div>
        </div>
      </section>
      <section className="section"><div className="panel"><div className="panel-title"><strong>Phase 1 engineering proof</strong><GitBranch size={18}/></div><div className="metrics">{[["Next.js App Router","16"],["Risk engine","Typed"],["Test coverage","Core"],["Cost","$0"]].map(([a,b])=><div key={a}><div className="metric-label">{a}</div><div className="metric-value" style={{fontSize:28}}>{b}</div></div>)}</div></div></section>
    </main>
  </div>;
}
