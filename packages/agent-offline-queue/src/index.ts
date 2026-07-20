import type {
  OfflineQueueItem,
  OfflineQueuePolicy,
  OfflineQueueReport
} from "./types.js";

export type {
  OfflineItemPriority,
  OfflineItemStatus,
  OfflineQueueItem,
  OfflineQueuePolicy,
  OfflineQueueReport
} from "./types.js";

const priorityRank = {
  critical:4,
  high:3,
  normal:2,
  low:1
} as const;

export function calculateNextAttemptAt(
  item:OfflineQueueItem,
  policy:OfflineQueuePolicy,
  now=new Date()
):string{
  const delaySeconds = policy.retryBaseSeconds * Math.max(1, 2 ** item.attempt);
  return new Date(now.getTime()+delaySeconds*1000).toISOString();
}

export function prepareDeliveryBatch(
  items:OfflineQueueItem[],
  policy:OfflineQueuePolicy,
  now=new Date()
):OfflineQueueItem[]{
  return items
    .filter(item =>
      item.status==="queued" &&
      new Date(item.nextAttemptAt).getTime()<=now.getTime() &&
      (!item.expiresAt || new Date(item.expiresAt).getTime()>now.getTime()) &&
      item.attempt<policy.maximumAttempts
    )
    .sort((a,b) =>
      priorityRank[b.priority]-priorityRank[a.priority] ||
      new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    )
    .slice(0,policy.batchSize);
}

export function markDeliveryFailure(
  item:OfflineQueueItem,
  policy:OfflineQueuePolicy,
  now=new Date()
):OfflineQueueItem{
  const nextAttempt=item.attempt+1;
  if(nextAttempt>=policy.maximumAttempts){
    return{
      ...item,
      attempt:nextAttempt,
      status:"dead-letter"
    };
  }

  return{
    ...item,
    attempt:nextAttempt,
    status:"queued",
    nextAttemptAt:calculateNextAttemptAt(
      {...item,attempt:nextAttempt},
      policy,
      now
    )
  };
}

export function evaluateOfflineQueue(
  items:OfflineQueueItem[],
  policy:OfflineQueuePolicy,
  now=new Date()
):OfflineQueueReport{
  const seenKeys=new Set<string>();
  const duplicateItemIds:string[]=[];
  const expiredItemIds:string[]=[];
  const deadLetterItemIds:string[]=[];
  const validItems:OfflineQueueItem[]=[];

  for(const item of items){
    if(seenKeys.has(item.deduplicationKey)){
      duplicateItemIds.push(item.id);
      continue;
    }
    seenKeys.add(item.deduplicationKey);

    if(item.expiresAt && new Date(item.expiresAt).getTime()<=now.getTime()){
      expiredItemIds.push(item.id);
      continue;
    }

    if(item.status==="dead-letter" || item.attempt>=policy.maximumAttempts){
      deadLetterItemIds.push(item.id);
      continue;
    }

    validItems.push(item);
  }

  const totalBytes=validItems.reduce((sum,item)=>sum+item.sizeBytes,0);
  const droppedItemIds:string[]=[];

  if(validItems.length>policy.maximumItems || totalBytes>policy.maximumBytes){
    const removable=[...validItems].sort((a,b) =>
      priorityRank[a.priority]-priorityRank[b.priority] ||
      new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );

    let remainingItems=validItems.length;
    let remainingBytes=totalBytes;

    for(const item of removable){
      if(
        remainingItems<=policy.maximumItems &&
        remainingBytes<=policy.maximumBytes
      )break;

      droppedItemIds.push(item.id);
      remainingItems-=1;
      remainingBytes-=item.sizeBytes;
    }
  }

  const blocked =
    deadLetterItemIds.some(id=>
      items.find(item=>item.id===id)?.priority==="critical"
    ) ||
    droppedItemIds.some(id=>
      items.find(item=>item.id===id)?.priority==="critical"
    );

  const readyItemIds=prepareDeliveryBatch(
    validItems.filter(item=>!droppedItemIds.includes(item.id)),
    policy,
    now
  ).map(item=>item.id);

  return{
    readyItemIds,
    expiredItemIds,
    duplicateItemIds,
    deadLetterItemIds,
    droppedItemIds,
    totalBytes,
    decision:blocked
      ?"blocked"
      :expiredItemIds.length>0 ||
       duplicateItemIds.length>0 ||
       deadLetterItemIds.length>0 ||
       droppedItemIds.length>0
        ?"degraded"
        :"healthy"
  };
}

export function createOfflineQueueSummary(
  report:OfflineQueueReport
):string{
  return[
    `Offline queue decision: ${report.decision}`,
    `Ready items: ${report.readyItemIds.length}`,
    `Expired items: ${report.expiredItemIds.length}`,
    `Duplicate items: ${report.duplicateItemIds.length}`,
    `Dead-letter items: ${report.deadLetterItemIds.length}`,
    `Dropped items: ${report.droppedItemIds.length}`
  ].join("\n");
}
