"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, GitBranch, Radar, ShieldCheck, Cpu, TerminalSquare } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import { SecurityMesh } from "./security-mesh";
import { AttackGraph } from "./attack-graph";
import type { ScanResult, ScanScore } from "@sentinel/security-core";

type ScannerState = Record<string, "active" | "unavailable" | "completed">;
type ApiResult = ScanResult & { score: ScanScore; scannerStatus: ScannerState };
type ScanJob = { id:string; status:"queued"|"running"|"completed"|"failed"; progress:number; stage:string; logs:Array<{at:string;message:string}>; result?:ApiResult; error?:string };
const initialLogs = ["Scanner worker ready", "Waiting for a public repository target"];

export function SentinelDashboard() {
  const [repositoryUrl,setRepositoryUrl]=useState("https://github.com/expressjs/express");
  const [result,setResult]=useState<ApiResult|null>(null);
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState(0);
  const [stage,setStage]=useState("idle");
  const [error,setError]=useState("");
  const [logs,setLogs]=useState(initialLogs);
  const abortRef=useRef<AbortController|null>(null);

  async function scan(event:FormEvent){
    event.preventDefault();
    abortRef.current?.abort();
    const controller=new AbortController(); abortRef.current=controller;
    setError(""); setLoading(true); setResult(null); setProgress(2); setStage("queued"); setLogs(["Submitting scan job",`Target: ${repositoryUrl}`]);
    try {
      const response=await fetch("/api/scans",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({repositoryUrl}),signal:controller.signal});
      const accepted=await response.json();
      if(!response.ok) throw new Error(accepted.error ?? "Scan failed");
      while(!controller.signal.aborted){
        const jobResponse=await fetch(`/api/scans/${accepted.jobId}`,{cache:"no-store",signal:controller.signal});
        const job=await jobResponse.json() as ScanJob;
        if(!jobResponse.ok) throw new Error((job as unknown as {error?:string}).error ?? "Scan job unavailable");
        setProgress(job.progress); setStage(job.stage); setLogs(job.logs.map(item=>item.message));
        if(job.status==="completed"&&job.result){setResult(job.result);break;}
        if(job.status==="failed") throw new Error(job.error ?? "Scanner worker failed");
        await new Promise(resolve=>setTimeout(resolve,700));
      }
    } catch(e){ if((e as Error).name!=="AbortError"){setError(e instanceof Error?e.message:"Scan failed");setProgress(0);} }
    finally { setLoading(false); }
  }

  const metrics=useMemo(()=>[
    ["Security score",result?.score.overall ?? 100],
    ["Open findings",result?.findings.length ?? 0],
    ["Attack paths",result?.attackPaths.length ?? 0],
    ["Assets mapped",result?.assets.length ?? 0],
  ],[result]);
  const scannerEntries=Object.entries(result?.scannerStatus??{builtin:"active",semgrep:"active",gitleaks:"active",osv:"active"});

  return <div className="shell"><div className="grid-bg"/><nav className="nav"><div className="brand"><span className="brand-mark"><ShieldCheck size={19}/></span>Sentinel Mesh</div><div className="status"><i/>Phase 3 attack intelligence</div></nav>
    <main>
      <section className="hero">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
          <div className="eyebrow">Open-source DevSecOps intelligence</div>
          <h1>Map real systems. Trace real attack paths.</h1>
          <p className="lede">Sentinel Mesh discovers endpoints, services, databases, dependencies and trust boundaries, then calculates contextual paths from exposed entry points to sensitive assets.</p>
          <form className="scan-form" onSubmit={scan}><input aria-label="Public GitHub repository URL" value={repositoryUrl} onChange={e=>setRepositoryUrl(e.target.value)} placeholder="https://github.com/owner/repository"/><button className="primary" disabled={loading}>{loading?`${stage} ${progress}%`:"Run real scan"}</button></form>
          <p className="form-note">Only public GitHub repositories are accepted. Temporary files are deleted after every scan.</p>
          {error&&<div className="error">{error}</div>}
        </motion.div>
        <motion.div className="hero-visual" initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.9,delay:.12}}>
          <div className="canvas-wrap"><SecurityMesh active={loading||!!result}/></div><div className="scan-overlay"><span className="chip">EPHEMERAL SANDBOX</span><span className="chip">ASSET + ATTACK GRAPH</span></div>
        </motion.div>
      </section>

      <section className="section"><div className="section-head"><div><div className="eyebrow">Security command center</div><h2>One repository, a complete security topology.</h2></div><p>Scanner findings are correlated with discovered assets and data-flow relations to calculate explainable attack paths.</p></div>
        <div className="metrics">{metrics.map(([label,value],i)=><motion.div className="metric" key={label} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.08*i}}><div className="metric-label">{label}</div><div className="metric-value">{value}</div></motion.div>)}</div>
        <div className="scanner-strip">{scannerEntries.map(([name,status])=><div className="scanner-pill" key={name}><Cpu size={15}/><span>{name}</span><b className={status}>{status}</b></div>)}</div>
        <div className="content-grid">
          <div className="panel"><div className="panel-title"><strong>Prioritized findings</strong><Radar size={18}/></div>
            <AnimatePresence mode="popLayout">{result?result.findings.slice(0,12).map((f,i)=><motion.div className="finding" key={f.id} initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:.04*i}}><div className={`severity ${f.severity}`}>{f.severity.toUpperCase()}</div><div><strong>{f.title}</strong><p>{f.scanner} · {f.filePath}:{f.startLine} · {f.cwe??f.category}</p></div><div>{f.riskScore}</div></motion.div>):<div className="empty">Start a real repository scan. Findings from every available scanner will be normalized into this view.</div>}</AnimatePresence>
          </div>
          <div className="panel"><div className="panel-title"><strong>Worker telemetry</strong><Activity size={18}/></div><div className="score-ring" style={{"--score":result?.score.overall??100} as React.CSSProperties}><span>{result?.score.overall??100}</span></div><div className="metric-label">{stage} · {progress}%</div><div className="progress"><div style={{width:`${progress}%`}}/></div><div className="log" aria-live="polite">{logs.slice(-8).map((log,i)=><div key={`${log}-${i}`}><b>{String(Math.max(1,logs.length-7+i)).padStart(2,"0")}</b> {log}</div>)}</div></div>
        </div>
      </section>
      <section className="section"><div className="section-head"><div><div className="eyebrow">Attack intelligence</div><h2>From files to explainable attack paths.</h2></div><p>Endpoints, imports, databases, secrets and authentication boundaries are converted into an asset-relation graph. Findings provide the exploit evidence.</p></div><div className="panel"><div className="panel-title"><strong>Calculated attack graph</strong><GitBranch size={18}/></div>{result?<AttackGraph assets={result.assets} relations={result.relations} paths={result.attackPaths}/>:<div className="empty">Run a scan to build the repository topology and calculate attack paths.</div>}<div className="path-list">{result?.attackPaths.slice(0,5).map(path=><div className="path-row" key={path.id}><div><strong>{path.title}</strong><p>{path.assetIds.length} assets · likelihood {Math.round(path.likelihood*100)}% · impact {Math.round(path.impact*100)}%</p></div><b>{path.score}</b></div>)}</div></div></section>
      <section className="section"><div className="panel"><div className="panel-title"><strong>Phase 3 engineering proof</strong><TerminalSquare size={18}/></div><div className="metrics">{[["Asset discovery","Endpoints + data"],["Relation engine","Evidence based"],["Path algorithm","Graph traversal"],["Visualization","Interactive SVG"]].map(([a,b])=><div key={a}><div className="metric-label">{a}</div><div className="metric-value" style={{fontSize:23}}>{b}</div></div>)}</div></div></section>
    </main>
  </div>;
}
