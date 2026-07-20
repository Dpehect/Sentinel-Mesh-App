import {describe,expect,it} from "vitest";
import {
  assignScanJobs,
  evaluateDistributedScanning,
  recoverJobsFromFailedNodes
} from "./index.js";

const now = new Date("2026-07-20T10:00:00.000Z");

describe("distributed scan nodes",()=>{
  it("assigns jobs by capability and available capacity",()=>{
    const assignments = assignScanJobs([
      {
        id:"node-eu",tenantIds:["org-1"],region:"eu",
        status:"online",capabilities:["cloud-scan"],
        maxConcurrentJobs:2,activeJobs:0,
        lastHeartbeatAt:"2026-07-20T09:59:30.000Z"
      }
    ],[
      {
        id:"job-1",tenantId:"org-1",capability:"cloud-scan",
        regionPreference:"eu",priority:10,status:"queued",attempt:0
      }
    ],now);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].nodeId).toBe("node-eu");
  });

  it("recovers jobs from stale nodes",()=>{
    const jobs = recoverJobsFromFailedNodes([
      {
        id:"node-old",tenantIds:[],region:"eu",
        status:"online",capabilities:["cloud-scan"],
        maxConcurrentJobs:1,activeJobs:1,
        lastHeartbeatAt:"2026-07-20T09:50:00.000Z"
      }
    ],[
      {
        id:"job-1",tenantId:"org-1",capability:"cloud-scan",
        priority:5,status:"running",assignedNodeId:"node-old",attempt:1
      }
    ],now);

    expect(jobs[0].status).toBe("queued");
    expect(jobs[0].attempt).toBe(2);
  });

  it("blocks when no live node can process queued jobs",()=>{
    const report = evaluateDistributedScanning([],[
      {
        id:"job-1",tenantId:"org-1",capability:"cloud-scan",
        priority:5,status:"queued",attempt:0
      }
    ],now);

    expect(report.decision).toBe("blocked");
    expect(report.unassignedJobs).toEqual(["job-1"]);
  });
});
