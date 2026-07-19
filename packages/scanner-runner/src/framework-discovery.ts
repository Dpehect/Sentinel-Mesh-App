import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import type { Asset, Finding, Relation } from "@sentinel/security-core";
import { analyzeTypeScriptRepository } from "./ast-analyzer";

export async function discoverFrameworkAssets(repositoryPath:string){
  const ast=await analyzeTypeScriptRepository(repositoryPath);
  const assets:Asset[]=[...ast.assets]; const relations:Relation[]=[...ast.relations]; const findings:Finding[]=[...ast.findings];
  const ensure=(asset:Asset)=>{if(!assets.some(a=>a.id===asset.id))assets.push(asset)};
  ensure({id:"repo",type:"repository",name:"Repository",exposure:"private",criticality:70,metadata:{}});
  if(ast.relations.some(r=>r.to==="database")) ensure({id:"database",type:"database",name:"Application database",exposure:"internal",criticality:95,metadata:{discoveredBy:"ast"}});
  if(ast.relations.some(r=>r.to==="secret-store")) ensure({id:"secret-store",type:"secret",name:"Runtime secrets",exposure:"private",criticality:90,metadata:{discoveredBy:"ast"}});
  if(ast.endpoints.some(e=>e.auth)) ensure({id:"auth-boundary",type:"service",name:"Authentication boundary",exposure:"internal",criticality:85,metadata:{discoveredBy:"ast"}});
  for(const a of ast.assets.filter(a=>a.type==="file")) relations.push({id:`repo:${a.id}`,from:"repo",to:a.id,kind:"contains"});

  const manifests=await fg(["package.json","**/package.json","Dockerfile","**/Dockerfile",".github/workflows/*.{yml,yaml}"],{cwd:repositoryPath,ignore:["**/node_modules/**","**/.git/**"],onlyFiles:true,followSymbolicLinks:false});
  for(const file of manifests.slice(0,300)){
    let content="";try{content=await readFile(`${repositoryPath}/${file}`,"utf8")}catch{continue}
    if(file.endsWith("package.json")){
      try{const pkg=JSON.parse(content);for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){
        const id=`dependency:${name}`; ensure({id,type:"dependency",name,exposure:"private",criticality:45,metadata:{version,manifest:file}}); relations.push({id:`${file}:${id}`,from:`file:${file}`,to:id,kind:"depends_on",evidence:`Declared in ${file}`});
      }}catch{}
    } else if(file.includes("Dockerfile")) ensure({id:`container:${file}`,type:"container",name:file,exposure:"internal",criticality:70,metadata:{}});
    else ensure({id:`workflow:${file}`,type:"workflow",name:file,exposure:"private",criticality:60,metadata:{}});
  }
  return {assets,relations,findings};
}
