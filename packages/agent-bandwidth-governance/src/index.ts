import type {
  BandwidthPlan,
  BandwidthPolicy,
  BandwidthWindow,
  CompressionMode,
  TransferCandidate,
  TransferPlanItem
} from "./types.js";

export type {
  BandwidthPlan,
  BandwidthPolicy,
  BandwidthWindow,
  CompressionMode,
  TransferCandidate,
  TransferPlanItem,
  TransferPriority
} from "./types.js";

const priorityRank = {critical:4, high:3, normal:2, low:1} as const;

function estimatedSize(
  item:TransferCandidate,
  compression:CompressionMode
):number{
  if(compression==="none")return item.sizeBytes;
  if(compression==="gzip")return Math.ceil(item.sizeBytes*0.65);
  return Math.ceil(item.sizeBytes*0.55);
}

function compressionFor(
  item:TransferCandidate,
  policy:BandwidthPolicy
):CompressionMode{
  if(!item.compressible || item.sizeBytes<policy.compressionThresholdBytes){
    return "none";
  }
  return policy.preferredCompression;
}

export function planBandwidthTransfer(
  candidates:TransferCandidate[],
  window:BandwidthWindow,
  policy:BandwidthPolicy,
  now=new Date()
):BandwidthPlan{
  const expiredItemIds=candidates
    .filter(item=>item.expiresAt && new Date(item.expiresAt).getTime()<=now.getTime())
    .map(item=>item.id);

  const valid=candidates
    .filter(item=>!expiredItemIds.includes(item.id))
    .sort((a,b)=>
      priorityRank[b.priority]-priorityRank[a.priority] ||
      new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );

  const totalRemaining=Math.max(0,window.maximumBytes-window.consumedBytes);
  const batchBudget=Math.min(totalRemaining,policy.maximumBatchBytes);
  const criticalReserve=Math.floor(
    batchBudget*policy.reservePercentForCritical/100
  );

  let used=0;
  const selected:TransferPlanItem[]=[];
  const deferredItemIds:string[]=[];

  const criticalItems=valid.filter(item=>item.priority==="critical");
  const otherItems=valid.filter(item=>item.priority!=="critical");

  const trySelect=(item:TransferCandidate,limit:number)=>{
    const compression=compressionFor(item,policy);
    const bytes=estimatedSize(item,compression);
    if(used+bytes<=limit){
      selected.push({id:item.id,compression,estimatedBytes:bytes});
      used+=bytes;
    }else{
      deferredItemIds.push(item.id);
    }
  };

  for(const item of criticalItems){
    trySelect(item,batchBudget);
  }

  const nonCriticalLimit=Math.max(used,batchBudget-criticalReserve);
  for(const item of otherItems){
    trySelect(item,nonCriticalLimit);
  }

  const remainingWindowBytes=Math.max(0,totalRemaining-used);
  const utilizationPercent=window.maximumBytes>0
    ?Math.round((window.consumedBytes+used)/window.maximumBytes*100)
    :100;

  return{
    selected,
    deferredItemIds,
    expiredItemIds,
    remainingWindowBytes,
    utilizationPercent,
    decision:totalRemaining===0
      ?"block"
      :utilizationPercent>=policy.backpressureThresholdPercent ||
       deferredItemIds.length>0
        ?"throttle"
        :"send"
  };
}

export function shouldApplyBackpressure(
  window:BandwidthWindow,
  policy:BandwidthPolicy
):boolean{
  if(window.maximumBytes<=0)return true;
  return window.consumedBytes/window.maximumBytes*100 >=
    policy.backpressureThresholdPercent;
}

export function createBandwidthSummary(plan:BandwidthPlan):string{
  return[
    `Bandwidth decision: ${plan.decision}`,
    `Selected items: ${plan.selected.length}`,
    `Deferred items: ${plan.deferredItemIds.length}`,
    `Expired items: ${plan.expiredItemIds.length}`,
    `Utilization: ${plan.utilizationPercent}%`
  ].join("\n");
}
