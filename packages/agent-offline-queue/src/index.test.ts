import{describe,expect,it}from"vitest";
import{
  evaluateOfflineQueue,
  markDeliveryFailure,
  prepareDeliveryBatch
}from"./index.js";

const policy={
  maximumItems:100,
  maximumBytes:100000,
  maximumAttempts:3,
  retryBaseSeconds:10,
  batchSize:2
};

const item=(id:string,priority:"critical"|"high"|"normal"|"low",createdAt:string)=>({
  id,tenantId:"org-1",agentId:"agent-1",
  type:"telemetry" as const,priority,createdAt,
  payloadHash:"a".repeat(64),sizeBytes:100,
  attempt:0,nextAttemptAt:createdAt,
  status:"queued" as const,deduplicationKey:`key-${id}`
});

describe("agent offline queue",()=>{
  it("prioritizes critical items",()=>{
    const batch=prepareDeliveryBatch([
      item("low","low","2026-07-20T10:00:00.000Z"),
      item("critical","critical","2026-07-20T10:01:00.000Z")
    ],policy,new Date("2026-07-20T10:05:00.000Z"));

    expect(batch[0].id).toBe("critical");
  });

  it("moves exhausted retries to dead letter",()=>{
    const failed=markDeliveryFailure({
      ...item("a","high","2026-07-20T10:00:00.000Z"),
      attempt:2
    },policy,new Date("2026-07-20T10:05:00.000Z"));

    expect(failed.status).toBe("dead-letter");
  });

  it("detects duplicate queue items",()=>{
    const first=item("a","normal","2026-07-20T10:00:00.000Z");
    const second={...item("b","normal","2026-07-20T10:01:00.000Z"),deduplicationKey:first.deduplicationKey};

    const report=evaluateOfflineQueue(
      [first,second],
      policy,
      new Date("2026-07-20T10:05:00.000Z")
    );

    expect(report.duplicateItemIds).toEqual(["b"]);
    expect(report.decision).toBe("degraded");
  });

  it("blocks when critical data reaches dead letter",()=>{
    const report=evaluateOfflineQueue([{
      ...item("critical","critical","2026-07-20T10:00:00.000Z"),
      status:"dead-letter" as const,
      attempt:3
    }],policy,new Date("2026-07-20T10:05:00.000Z"));

    expect(report.decision).toBe("blocked");
  });
});
