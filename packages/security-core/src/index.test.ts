import { describe, expect, it } from "vitest";
import { calculateFindingRisk, deriveAttackPaths, type Asset, type AssetRelation, type Finding } from "./index";

describe("security core",()=>{
  it("increases contextual risk for exposed sensitive assets",()=>{
    const base={id:"f",scanner:"test",category:"auth",severity:"high" as const,confidence:.9,title:"x",description:"x",filePath:"x",startLine:1,assetId:"a",exploitability:.8};
    expect(calculateFindingRisk(base,{id:"a",type:"endpoint",name:"api",exposure:1,sensitivity:1})).toBeGreaterThan(calculateFindingRisk(base,{id:"a",type:"service",name:"internal",exposure:.1,sensitivity:.2}));
  });
  it("derives an attack path from exposed endpoint to database",()=>{
    const assets:Asset[]=[{id:"api",type:"endpoint",name:"API",exposure:1,sensitivity:.5},{id:"db",type:"database",name:"DB",exposure:.2,sensitivity:1}];
    const relations:AssetRelation[]=[{id:"r",sourceId:"api",targetId:"db",type:"writes",confidence:.9}];
    const findings:Finding[]=[{id:"f",scanner:"x",category:"x",severity:"high",confidence:.9,title:"x",description:"x",filePath:"x",startLine:1,assetId:"api",exploitability:.8,riskScore:80}];
    expect(deriveAttackPaths(assets,relations,findings)).toHaveLength(1);
  });
});
