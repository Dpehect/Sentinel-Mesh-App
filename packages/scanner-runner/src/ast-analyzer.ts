import ts from "typescript";
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Asset, Finding, Relation, Severity } from "@sentinel/security-core";

const SOURCE_GLOBS = ["**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}"];
const IGNORE = ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.next/**", "**/coverage/**"];

type Endpoint = { id:string; file:string; method:string; route:string; line:number; auth:boolean };
type Sink = { kind:string; title:string; severity:Severity; cwe:string; owasp:string; category:string; remediation:string };

const sinkRules: Record<string, Sink> = {
  eval: { kind:"code_execution", title:"Dynamic code execution from untrusted input", severity:"critical", cwe:"CWE-95", owasp:"A03:2021", category:"injection", remediation:"Remove eval/new Function and use an explicit parser or allow-listed operation map." },
  exec: { kind:"command_injection", title:"Potential command injection", severity:"critical", cwe:"CWE-78", owasp:"A03:2021", category:"injection", remediation:"Avoid shell execution; use spawn/execFile with fixed binaries and validated argument arrays." },
  rawSql: { kind:"sql_injection", title:"Untrusted data reaches a raw SQL sink", severity:"critical", cwe:"CWE-89", owasp:"A03:2021", category:"injection", remediation:"Use parameterized ORM methods or tagged templates with bound parameters." },
  fetch: { kind:"ssrf", title:"User-controlled URL reaches a server-side request", severity:"high", cwe:"CWE-918", owasp:"A10:2021", category:"ssrf", remediation:"Allow-list destinations, resolve and validate IPs, block private ranges, and disable redirects." },
  file: { kind:"path_traversal", title:"User-controlled path reaches filesystem access", severity:"high", cwe:"CWE-22", owasp:"A01:2021", category:"path_traversal", remediation:"Resolve against a fixed base directory and reject paths escaping the allowed root." },
  redirect: { kind:"open_redirect", title:"User-controlled redirect target", severity:"medium", cwe:"CWE-601", owasp:"A01:2021", category:"redirect", remediation:"Use relative destinations or an explicit allow-list of trusted origins." },
};

function hash(value:string){ return createHash("sha256").update(value).digest("hex"); }
function lineOf(sf:ts.SourceFile,node:ts.Node){ return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1; }
function textOf(node:ts.Node,sf:ts.SourceFile){ return node.getText(sf).slice(0,220); }
function callName(expr:ts.Expression):string{
  if(ts.isIdentifier(expr)) return expr.text;
  if(ts.isPropertyAccessExpression(expr)) return `${callName(expr.expression)}.${expr.name.text}`;
  return expr.getText();
}
function isUserInput(node:ts.Node):boolean{
  const t=node.getText();
  return /\b(req|request)\.(body|query|params|headers|cookies)\b|\b(searchParams|params)\b|formData\.(get|getAll)\(|\b(req|request)\.json\(\)|url\.searchParams|cookies\(\)|headers\(\)/.test(t);
}
function containsUserInput(node:ts.Node):boolean{
  if(isUserInput(node)) return true;
  let found=false; node.forEachChild(c=>{ if(!found&&containsUserInput(c)) found=true; }); return found;
}
function hasAuthGuard(node:ts.Node):boolean{
  const t=node.getText();
  return /(getServerSession|auth\(|getUser\(|verifyToken|requireAuth|withAuth|session\?\.|currentUser|clerkClient|supabase\.auth)/.test(t);
}
function endpointFromNode(node:ts.Node,sf:ts.SourceFile,file:string):Endpoint|undefined{
  if(ts.isFunctionDeclaration(node)&&node.name&&["GET","POST","PUT","PATCH","DELETE"].includes(node.name.text)){
    return {id:`endpoint:${file}:${node.name.text}`,file,method:node.name.text,route:file.replace(/(^|\/)route\.[^.]+$/,""),line:lineOf(sf,node),auth:hasAuthGuard(node)};
  }
  if(ts.isVariableStatement(node)){
    for(const d of node.declarationList.declarations){
      if(ts.isIdentifier(d.name)&&["GET","POST","PUT","PATCH","DELETE"].includes(d.name.text)) return {id:`endpoint:${file}:${d.name.text}`,file,method:d.name.text,route:file.replace(/(^|\/)route\.[^.]+$/,""),line:lineOf(sf,node),auth:hasAuthGuard(node)};
    }
  }
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){
    const owner=node.expression.expression.getText(sf); const method=node.expression.name.text.toUpperCase();
    if(/^(app|router)$/.test(owner)&&["GET","POST","PUT","PATCH","DELETE","USE"].includes(method)){
      const route=node.arguments[0]&&ts.isStringLiteralLike(node.arguments[0])?node.arguments[0].text:"dynamic";
      return {id:`endpoint:${file}:${method}:${route}`,file,method,route,line:lineOf(sf,node),auth:hasAuthGuard(node)};
    }
  }
}
function sinkForCall(name:string):Sink|undefined{
  if(["eval","Function"].includes(name)||name.endsWith(".eval")) return sinkRules.eval;
  if(/(^|\.)(exec|execSync|spawn|spawnSync)$/.test(name)) return sinkRules.exec;
  if(/\.(\$queryRawUnsafe|\$executeRawUnsafe)$/.test(name)) return sinkRules.rawSql;
  if(["fetch","axios.get","axios.post","axios.request","http.get","https.get"].includes(name)) return sinkRules.fetch;
  if(/(^|\.)(readFile|readFileSync|writeFile|writeFileSync|createReadStream|createWriteStream|sendFile)$/.test(name)) return sinkRules.file;
  if(/(^|\.)(redirect)$/.test(name)) return sinkRules.redirect;
}
function finding(rule:Sink,file:string,sf:ts.SourceFile,node:ts.Node,confidence=.9):Finding{
  const fingerprint=hash(`${rule.kind}:${file}:${lineOf(sf,node)}:${textOf(node,sf)}`);
  return {id:fingerprint.slice(0,16),ruleId:`ast.${rule.kind}`,title:rule.title,description:`AST-based source-to-sink analysis found user-controlled input flowing into a ${rule.kind.replaceAll("_"," ")} sink.`,severity:rule.severity,confidence,category:rule.category,scanner:"sentinel-ast",cwe:rule.cwe,owasp:rule.owasp,assetId:`file:${file}`,evidence:[{file,line:lineOf(sf,node),excerpt:textOf(node,sf),source:"typescript-ast"}],remediation:rule.remediation,fingerprint};
}

export async function analyzeTypeScriptRepository(repositoryPath:string){
  const findings:Finding[]=[]; const assets:Asset[]=[]; const relations:Relation[]=[]; const endpoints:Endpoint[]=[];
  const files=await fg(SOURCE_GLOBS,{cwd:repositoryPath,ignore:IGNORE,onlyFiles:true,followSymbolicLinks:false});
  for(const file of files.slice(0,5000)){
    let source=""; try{source=await readFile(`${repositoryPath}/${file}`,"utf8")}catch{continue}
    const kind=file.endsWith("x")?ts.ScriptKind.TSX:file.endsWith(".js")||file.endsWith(".jsx")?ts.ScriptKind.JSX:ts.ScriptKind.TS;
    const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,kind);
    const fileId=`file:${file}`;
    let fileUsesDb=false, fileUsesSecrets=false, fileHasAuth=false;
    const visit=(node:ts.Node)=>{
      const ep=endpointFromNode(node,sf,file); if(ep&&!endpoints.some(x=>x.id===ep.id)){ endpoints.push(ep); fileHasAuth ||= ep.auth; }
      if(ts.isCallExpression(node)){
        const name=callName(node.expression); const sink=sinkForCall(name);
        if(sink&&node.arguments.some(containsUserInput)) findings.push(finding(sink,file,sf,node));
        if(/(prisma|db|knex|sequelize|mongoose|supabase)\./.test(name)) fileUsesDb=true;
        if(/(auth|getServerSession|getUser|verifyToken|requireAuth)/.test(name)) fileHasAuth=true;
        if(name==="dangerouslySetInnerHTML"||node.getText(sf).includes("dangerouslySetInnerHTML")){
          if(node.arguments.some(containsUserInput)) findings.push(finding({kind:"xss",title:"Untrusted HTML rendered into the DOM",severity:"high",cwe:"CWE-79",owasp:"A03:2021",category:"xss",remediation:"Sanitize with a maintained HTML sanitizer or render structured content instead of raw HTML."},file,sf,node,.88));
        }
      }
      if(ts.isPropertyAccessExpression(node)&&/process\.env|import\.meta\.env/.test(node.getText(sf))) fileUsesSecrets=true;
      ts.forEachChild(node,visit);
    }; visit(sf);
    assets.push({id:fileId,type:"file",name:file.split("/").pop()??file,path:file,exposure:"private",criticality:fileUsesDb||fileUsesSecrets?60:35,metadata:{ast:true,usesDatabase:fileUsesDb,usesSecrets:fileUsesSecrets,hasAuth:fileHasAuth}});
    if(fileUsesDb) relations.push({id:`${fileId}:db`,from:fileId,to:"database",kind:"writes",evidence:"AST detected ORM/database client usage"});
    if(fileUsesSecrets) relations.push({id:`${fileId}:secrets`,from:fileId,to:"secret-store",kind:"reads",evidence:"AST detected runtime environment access"});
  }
  for(const ep of endpoints){
    assets.push({id:ep.id,type:"endpoint",name:`${ep.method} ${ep.route||"/"}`,path:ep.file,exposure:"public",criticality:ep.auth?65:78,metadata:{method:ep.method,route:ep.route,line:ep.line,authenticated:ep.auth,framework:"typescript"}});
    relations.push({id:`${ep.id}:file`,from:ep.id,to:`file:${ep.file}`,kind:"calls",evidence:`Declared at ${ep.file}:${ep.line}`});
    if(ep.auth) relations.push({id:`${ep.id}:auth`,from:ep.id,to:"auth-boundary",kind:"authenticates",evidence:"Authentication guard detected in endpoint scope"});
    else {
      const fp=hash(`missing-auth:${ep.id}`);
      findings.push({id:fp.slice(0,16),ruleId:"ast.missing-auth-boundary",title:"Public endpoint has no detected authentication boundary",description:"The endpoint is publicly reachable and no recognized authentication or session guard was found in its handler scope.",severity:ep.method==="GET"?"medium":"high",confidence:.7,category:"authorization",scanner:"sentinel-ast",cwe:"CWE-306",owasp:"A01:2021",assetId:ep.id,evidence:[{file:ep.file,line:ep.line,excerpt:`${ep.method} ${ep.route}`,source:"typescript-ast"}],remediation:"Require authentication and enforce resource-level authorization before accessing sensitive operations.",fingerprint:fp});
    }
  }
  return {findings,assets,relations,endpoints};
}
