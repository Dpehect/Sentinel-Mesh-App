import{describe,expect,it}from"vitest";
import{planAdaptiveSchedule}from"./index.js";

const policy={
  maximumCpuPercent:80,
  maximumMemoryPercent:85,
  minimumBatteryPercent:25,
  maximumConcurrentTasks:2,
  allowCriticalBatteryOverride:true
};

const state={
  agentId:"agent-1",
  cpuPercent:20,
  memoryPercent:30,
  batteryPercent:15,
  onExternalPower:false,
  userActive:true,
  networkMetered:false,
  runningTaskIds:[]
};

describe("agent adaptive scheduling",()=>{
  it("allows critical tasks to override battery restrictions",()=>{
    const result=planAdaptiveSchedule(state,[{
      id:"critical",agentId:"agent-1",priority:"critical",
      cpuCost:10,memoryCost:10,requiresUnmeteredNetwork:false,
      canRunWhileUserActive:false,createdAt:"2026-07-20T10:00:00.000Z"
    }],[],policy);
    expect(result.scheduledTaskIds).toEqual(["critical"]);
  });

  it("defers normal tasks while user is active",()=>{
    const result=planAdaptiveSchedule(state,[{
      id:"normal",agentId:"agent-1",priority:"normal",
      cpuCost:10,memoryCost:10,requiresUnmeteredNetwork:false,
      canRunWhileUserActive:false,createdAt:"2026-07-20T10:00:00.000Z"
    }],[],policy);
    expect(result.deferredTaskIds).toEqual(["normal"]);
    expect(result.reasons.normal).toBe("USER_ACTIVE");
  });

  it("suspends running tasks under resource pressure",()=>{
    const result=planAdaptiveSchedule({
      ...state,cpuPercent:95,runningTaskIds:["running-1"]
    },[],[],policy);
    expect(result.decision).toBe("suspend");
    expect(result.suspendedTaskIds).toEqual(["running-1"]);
  });

  it("respects maintenance windows",()=>{
    const result=planAdaptiveSchedule({...state,userActive:false,batteryPercent:100},[{
      id:"task-1",agentId:"agent-1",priority:"normal",
      cpuCost:10,memoryCost:10,requiresUnmeteredNetwork:false,
      canRunWhileUserActive:true,createdAt:"2026-07-20T10:00:00.000Z",
      maintenanceWindowId:"mw-1"
    }],[{
      id:"mw-1",startsAt:"2026-07-20T11:00:00.000Z",
      endsAt:"2026-07-20T12:00:00.000Z"
    }],policy,new Date("2026-07-20T10:30:00.000Z"));
    expect(result.reasons["task-1"]).toBe("OUTSIDE_MAINTENANCE_WINDOW");
  });
});
