"use client";

import {useMemo, useState} from "react";
import type {SecurityGraph} from "@sentinel/posture-intelligence";

const kindClass: Record<string,string> = {
  internet:"graph-node internet",
  workload:"graph-node workload",
  service:"graph-node service",
  identity:"graph-node identity",
  resource:"graph-node resource"
};

export function PostureGraph({graph}:{graph:SecurityGraph}){
  const [selected,setSelected]=useState<string>("internet");
  const selectedNode=useMemo(
    ()=>graph.nodes.find(node=>node.id===selected) ?? graph.nodes[0],
    [graph.nodes,selected]
  );

  return <div className="posture-graph-layout">
    <div className="posture-graph-canvas" role="img" aria-label="Cloud asset security graph">
      {graph.nodes.map((node,index)=>{
        const angle=(Math.PI*2*index)/Math.max(graph.nodes.length,1);
        const radius=index===0?0:34;
        const left=50+Math.cos(angle)*radius;
        const top=48+Math.sin(angle)*radius;
        return <button
          type="button"
          key={node.id}
          className={`${kindClass[node.kind] ?? "graph-node"} ${selected===node.id?"selected":""}`}
          style={{left:`${left}%`,top:`${top}%`}}
          onClick={()=>setSelected(node.id)}
          aria-label={`${node.label}, risk ${node.risk}`}
        >
          <span>{node.label}</span>
          <strong>{node.risk}</strong>
        </button>;
      })}
      <svg className="graph-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {graph.edges.map(edge=>{
          const sourceIndex=graph.nodes.findIndex(n=>n.id===edge.source);
          const targetIndex=graph.nodes.findIndex(n=>n.id===edge.target);
          const point=(index:number)=>{
            const angle=(Math.PI*2*index)/Math.max(graph.nodes.length,1);
            const radius=index===0?0:34;
            return {x:50+Math.cos(angle)*radius,y:48+Math.sin(angle)*radius};
          };
          const a=point(sourceIndex);
          const b=point(targetIndex);
          return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>;
        })}
      </svg>
    </div>

    <aside className="graph-inspector">
      <p className="eyebrow">Selected asset</p>
      <h3>{selectedNode?.label}</h3>
      <dl>
        <div><dt>Kind</dt><dd>{selectedNode?.kind}</dd></div>
        <div><dt>Provider</dt><dd>{selectedNode?.provider}</dd></div>
        <div><dt>Risk</dt><dd>{selectedNode?.risk}/100</dd></div>
        <div><dt>Severity</dt><dd>{selectedNode?.severity ?? "none"}</dd></div>
      </dl>
      <pre>{JSON.stringify(selectedNode?.metadata ?? {},null,2)}</pre>
    </aside>
  </div>;
}
