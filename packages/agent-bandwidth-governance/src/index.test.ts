import{describe,expect,it}from"vitest";
import{
  planBandwidthTransfer,
  shouldApplyBackpressure
}from"./index.js";

const policy={
  maximumBatchBytes:1000,
  reservePercentForCritical:25,
  compressionThresholdBytes:200,
  preferredCompression:"gzip" as const,
  backpressureThresholdPercent:85
};

const window={
  tenantId:"org-1",agentId:"agent-1",
  windowStartedAt:"2026-07-20T10:00:00.000Z",
  windowSeconds:60,maximumBytes:2000,consumedBytes:0
};

describe("agent bandwidth governance",()=>{
  it("prioritizes critical telemetry",()=>{
    const plan=planBandwidthTransfer([
      {
        id:"normal",tenantId:"org-1",agentId:"agent-1",
        priority:"normal",sizeBytes:900,compressible:false,
        createdAt:"2026-07-20T10:00:00.000Z"
      },
      {
        id:"critical",tenantId:"org-1",agentId:"agent-1",
        priority:"critical",sizeBytes:300,compressible:true,
        createdAt:"2026-07-20T10:01:00.000Z"
      }
    ],window,policy,new Date("2026-07-20T10:05:00.000Z"));

    expect(plan.selected[0].id).toBe("critical");
    expect(plan.selected[0].compression).toBe("gzip");
  });

  it("throttles when items exceed the batch budget",()=>{
    const plan=planBandwidthTransfer([{
      id:"large",tenantId:"org-1",agentId:"agent-1",
      priority:"normal",sizeBytes:2000,compressible:false,
      createdAt:"2026-07-20T10:00:00.000Z"
    }],window,policy);

    expect(plan.decision).toBe("throttle");
    expect(plan.deferredItemIds).toEqual(["large"]);
  });

  it("blocks when the bandwidth window is exhausted",()=>{
    const plan=planBandwidthTransfer([],{
      ...window,consumedBytes:2000
    },policy);

    expect(plan.decision).toBe("block");
  });

  it("detects backpressure threshold",()=>{
    expect(shouldApplyBackpressure({
      ...window,consumedBytes:1800
    },policy)).toBe(true);
  });
});
