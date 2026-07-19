"use client";

import { useEffect, useRef, useState } from "react";

type ScanJob = {
  id?: string;
  status: string;
  stage?: string;
  progress?: number;
  logs?: string[];
  error?: string;
};

export function ScanLauncher() {
  const [url, setUrl] = useState("https://github.com/vercel/next.js");
  const [job, setJob] = useState<ScanJob>();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => () => sourceRef.current?.close(), []);

  async function run() {
    sourceRef.current?.close();
    setJob({ status: "submitting", stage: "submitting", progress: 4, logs: ["Submitting persistent scan job"] });
    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repositoryUrl: url })
      });
      const submitted = await response.json();
      if (!response.ok) throw new Error(submitted.error?.formErrors?.join(", ") || submitted.error || "Scan submission failed");
      setJob(submitted);
      if (submitted.id) watch(submitted.id);
    } catch (error) {
      setJob({ status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  function watch(id: string) {
    const source = new EventSource(`/api/scans/${id}/events`);
    sourceRef.current = source;
    source.addEventListener("scan", (event) => {
      const next = JSON.parse((event as MessageEvent).data) as ScanJob;
      setJob(next);
      if (["complete", "failed"].includes(next.status)) {
        source.close();
        if (next.status === "complete") void fetch(`/api/scans/${id}`, { cache: "no-store" });
      }
    });
    source.onerror = () => {
      source.close();
      void poll(id);
    };
  }

  async function poll(id: string) {
    for (;;) {
      const response = await fetch(`/api/scans/${id}`, { cache: "no-store" });
      const next = await response.json();
      setJob(next);
      if (["complete", "failed"].includes(next.status)) return;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Run repository scan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} aria-label="Public GitHub repository URL" />
        <button className="button" onClick={run} disabled={job?.status === "submitting" || job?.status === "scanning"}>Start scan</button>
      </div>
      {job && (
        <div style={{ marginTop: 16 }} aria-live="polite">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{job.stage ?? job.status}</span>
            <span>{job.progress ?? 0}%</span>
          </div>
          <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${job.progress ?? 0}%` }} /></div>
          <div className="code" style={{ marginTop: 12 }}>{(job.logs ?? []).join("\n")}{job.error ? `\n${job.error}` : ""}</div>
        </div>
      )}
    </div>
  );
}
