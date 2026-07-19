import test from "node:test";
import assert from "node:assert/strict";
import { calculateFindingRisk, demoScan, scoreScan, type Asset } from "./index.js";

test("context raises finding risk for exposed sensitive assets",()=>{
  const low:Asset={id:"a",type:"service",name:"Low",exposure:.1,sensitivity:.1};
  const high:Asset={...low,exposure:1,sensitivity:1};
  const finding={id:"f",scanner:"test",category:"x",severity:"high" as const,confidence:.9,title:"x",description:"x",filePath:"x",startLine:1,assetId:"a",exploitability:.8};
  assert.ok(calculateFindingRisk(finding,high)>calculateFindingRisk(finding,low));
});

test("demo scan produces normalized security intelligence",()=>{
  const scan=demoScan("https://github.com/example/repo");
  assert.equal(scan.findings.length,4); assert.equal(scan.attackPaths.length,1); assert.ok(scoreScan(scan.findings,scan.assets).overall<100);
});
