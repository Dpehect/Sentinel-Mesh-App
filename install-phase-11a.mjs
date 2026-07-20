import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const target=process.argv[2]?path.resolve(process.argv[2]):process.cwd();
const overlay=path.join(here,"overlay");
const required=["package.json","apps/web/package.json","apps/web/src/lib/navigation.ts"];
for(const item of required){if(!fs.existsSync(path.join(target,item))){console.error(`Sentinel Mesh root not found: missing ${item}`);process.exit(1)}}
function copyTree(src,dst){fs.mkdirSync(dst,{recursive:true});for(const entry of fs.readdirSync(src,{withFileTypes:true})){const a=path.join(src,entry.name),b=path.join(dst,entry.name);entry.isDirectory()?copyTree(a,b):fs.copyFileSync(a,b)}}
copyTree(overlay,target);
function readJson(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
function writeJson(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n")}
const rootPath=path.join(target,"package.json"); const root=readJson(rootPath);
root.version="1.6.0";
const addWorkspace=(script,workspace)=>{const current=root.scripts[script]??"";if(!current.includes(workspace)) root.scripts[script]=`${current} && npm run ${script.startsWith("test")?"test":script.startsWith("typecheck")?"typecheck":"build"} -w ${workspace}`.replace(/^ && /,"")};
addWorkspace("build:packages","@sentinel/posture-intelligence");
root.scripts["test:posture"]="npm run test -w @sentinel/posture-intelligence";
root.scripts["typecheck:posture"]="npm run typecheck -w @sentinel/posture-intelligence";
if(!root.scripts.test.includes("test:posture")) root.scripts.test += " test:posture";
if(!root.scripts.typecheck.includes("typecheck:posture")) root.scripts.typecheck += " typecheck:posture";
writeJson(rootPath,root);
const webPath=path.join(target,"apps/web/package.json"); const web=readJson(webPath); web.dependencies={...(web.dependencies??{}),"@sentinel/posture-intelligence":"*"}; writeJson(webPath,web);
const navPath=path.join(target,"apps/web/src/lib/navigation.ts"); let nav=fs.readFileSync(navPath,"utf8");
if(!nav.includes('href:"/posture"')&&!nav.includes("href: '/posture'")){
  const marker=/\[(\s*)\{/; nav=nav.replace(marker,(m,space)=>`[${space}{href:"/posture",label:"Cloud posture"},${space}{`); fs.writeFileSync(navPath,nav);
}
const changelog=path.join(target,"CHANGELOG.md"); if(fs.existsSync(changelog)){let c=fs.readFileSync(changelog,"utf8");if(!c.includes("1.6.0 — Cloud & Kubernetes Posture")) fs.writeFileSync(changelog,`## 1.6.0 — Cloud & Kubernetes Posture\n\n- Added offline Kubernetes, Terraform, CloudFormation and Docker Compose posture intelligence.\n- Added 23 deterministic rules, posture scoring, attack-path correlation, dashboard, API and persistence schema.\n\n${c}`)}
console.log("Phase 11A installed. Run: npm install && npm run verify");
