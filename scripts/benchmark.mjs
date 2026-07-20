import {performance} from "node:perf_hooks";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const fixtures=["examples/vulnerable-demo"];
const results=[];
for(const fixture of fixtures){const start=performance.now();let files=0;const {readdir}=await import("node:fs/promises");async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,entry.name);if(entry.isDirectory())await walk(p);else files++}}await walk(fixture);results.push({fixture,files,durationMs:Math.round(performance.now()-start),recordedAt:new Date().toISOString()})}
await mkdir("benchmarks/results",{recursive:true});await writeFile("benchmarks/results/latest.json",JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
