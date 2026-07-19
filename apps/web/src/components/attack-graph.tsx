"use client";
import { motion } from "framer-motion";
import type { Asset, AssetRelation, AttackPath } from "@sentinel/security-core";

const positions=[[70,160],[210,70],[210,250],[390,110],[390,250],[570,160],[710,80],[710,245]];
export function AttackGraph({assets,relations,paths}:{assets:Asset[];relations:AssetRelation[];paths:AttackPath[]}){
  const chosen=(paths[0]?.assetIds??assets.slice(0,6).map(a=>a.id)).slice(0,8);
  const nodes=chosen.map((id,i)=>({asset:assets.find(a=>a.id===id),x:positions[i]?.[0]??70+i*90,y:positions[i]?.[1]??160})).filter(n=>n.asset) as Array<{asset:Asset;x:number;y:number}>;
  const visible=new Set(nodes.map(n=>n.asset.id));
  const edges=relations.filter(r=>visible.has(r.sourceId)&&visible.has(r.targetId));
  return <div className="attack-graph"><svg viewBox="0 0 780 320" role="img" aria-label="Calculated software attack graph">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>
    {edges.map((e,i)=>{const a=nodes.find(n=>n.asset.id===e.sourceId),b=nodes.find(n=>n.asset.id===e.targetId);if(!a||!b)return null;return <motion.line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="graph-edge" markerEnd="url(#arrow)" initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:.8}} transition={{delay:i*.08}}/>})}
    {nodes.map((n,i)=><motion.g key={n.asset.id} initial={{opacity:0,scale:.6}} animate={{opacity:1,scale:1}} transition={{delay:.08*i}}><circle cx={n.x} cy={n.y} r={n.asset.type==="database"||n.asset.type==="secret"?28:22} className={`graph-node ${n.asset.type}`}/><text x={n.x} y={n.y+42} textAnchor="middle">{n.asset.name.slice(0,24)}</text><text x={n.x} y={n.y+4} textAnchor="middle" className="graph-symbol">{n.asset.type.slice(0,2).toUpperCase()}</text></motion.g>)}
  </svg></div>
}
