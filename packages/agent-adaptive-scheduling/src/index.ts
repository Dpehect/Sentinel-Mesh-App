import type {
  AdaptiveScheduleDecision,
  AdaptiveSchedulePolicy,
  AdaptiveTask,
  AgentRuntimeState,
  MaintenanceWindow
} from "./types.js";

export type {
  AdaptiveScheduleDecision,
  AdaptiveSchedulePolicy,
  AdaptiveTask,
  AdaptiveTaskPriority,
  AgentRuntimeState,
  MaintenanceWindow
} from "./types.js";

const priorityRank={critical:4,high:3,normal:2,low:1} as const;

function inMaintenanceWindow(task:AdaptiveTask,windows:MaintenanceWindow[],now:Date):boolean{
  if(!task.maintenanceWindowId)return true;
  const window=windows.find(item=>item.id===task.maintenanceWindowId);
  if(!window)return false;
  const time=now.getTime();
  return time>=new Date(window.startsAt).getTime()&&time<=new Date(window.endsAt).getTime();
}

export function planAdaptiveSchedule(
  state:AgentRuntimeState,
  tasks:AdaptiveTask[],
  windows:MaintenanceWindow[],
  policy:AdaptiveSchedulePolicy,
  now=new Date()
):AdaptiveScheduleDecision{
  const scheduledTaskIds:string[]=[];
  const deferredTaskIds:string[]=[];
  const suspendedTaskIds:string[]=[];
  const reasons:Record<string,string>={};

  if(
    state.cpuPercent>=policy.maximumCpuPercent ||
    state.memoryPercent>=policy.maximumMemoryPercent
  ){
    for(const id of state.runningTaskIds){
      suspendedTaskIds.push(id);
      reasons[id]="RESOURCE_PRESSURE";
    }
  }

  let projectedCpu=state.cpuPercent;
  let projectedMemory=state.memoryPercent;
  let slots=Math.max(0,policy.maximumConcurrentTasks-state.runningTaskIds.length+suspendedTaskIds.length);

  const ordered=[...tasks]
    .filter(task=>task.agentId===state.agentId)
    .sort((a,b)=>
      priorityRank[b.priority]-priorityRank[a.priority] ||
      new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );

  for(const task of ordered){
    const critical=task.priority==="critical";

    if(slots<=0){
      deferredTaskIds.push(task.id);
      reasons[task.id]="CONCURRENCY_LIMIT";
      continue;
    }
    if(!inMaintenanceWindow(task,windows,now)&&!critical){
      deferredTaskIds.push(task.id);
      reasons[task.id]="OUTSIDE_MAINTENANCE_WINDOW";
      continue;
    }
    if(state.userActive&&!task.canRunWhileUserActive&&!critical){
      deferredTaskIds.push(task.id);
      reasons[task.id]="USER_ACTIVE";
      continue;
    }
    if(state.networkMetered&&task.requiresUnmeteredNetwork&&!critical){
      deferredTaskIds.push(task.id);
      reasons[task.id]="METERED_NETWORK";
      continue;
    }
    if(
      state.batteryPercent!==undefined &&
      state.onExternalPower!==true &&
      state.batteryPercent<policy.minimumBatteryPercent &&
      !(critical&&policy.allowCriticalBatteryOverride)
    ){
      deferredTaskIds.push(task.id);
      reasons[task.id]="LOW_BATTERY";
      continue;
    }
    if(
      projectedCpu+task.cpuCost>policy.maximumCpuPercent ||
      projectedMemory+task.memoryCost>policy.maximumMemoryPercent
    ){
      deferredTaskIds.push(task.id);
      reasons[task.id]="RESOURCE_BUDGET";
      continue;
    }

    scheduledTaskIds.push(task.id);
    projectedCpu+=task.cpuCost;
    projectedMemory+=task.memoryCost;
    slots-=1;
  }

  return{
    scheduledTaskIds,
    deferredTaskIds,
    suspendedTaskIds,
    reasons,
    decision:suspendedTaskIds.length>0
      ?"suspend"
      :scheduledTaskIds.length>0
        ?"schedule"
        :"defer"
  };
}

export function createAdaptiveScheduleSummary(result:AdaptiveScheduleDecision):string{
  return[
    `Adaptive scheduling decision: ${result.decision}`,
    `Scheduled tasks: ${result.scheduledTaskIds.length}`,
    `Deferred tasks: ${result.deferredTaskIds.length}`,
    `Suspended tasks: ${result.suspendedTaskIds.length}`
  ].join("\n");
}
