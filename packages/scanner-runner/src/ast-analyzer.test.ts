import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { analyzeTypeScriptRepository } from "./ast-analyzer";

describe("AST security analyzer",()=>{
  it("discovers endpoints and source-to-sink flows",async()=>{
    const dir=await mkdtemp(join(tmpdir(),"sentinel-ast-"));
    try{
      await mkdir(join(dir,"app/api/run"),{recursive:true});
      await writeFile(join(dir,"app/api/run/route.ts"),`import {exec} from "node:child_process"; export async function POST(req:Request){exec((await req.json()).command);}`);
      const result=await analyzeTypeScriptRepository(dir);
      expect(result.endpoints.some(e=>e.method==="POST")).toBe(true);
      expect(result.findings.some(f=>f.ruleId==="ast.command_injection")).toBe(true);
      expect(result.findings.some(f=>f.ruleId==="ast.missing-auth-boundary")).toBe(true);
    } finally { await rm(dir,{recursive:true,force:true}); }
  });
});
