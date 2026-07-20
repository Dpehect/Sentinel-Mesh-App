import type {
  AgentTrustKey,
  KeyRotationPlan,
  RotationPolicy,
  TrustStore,
  TrustStoreTransition
} from "./types.js";

export type {
  AgentTrustKey,
  KeyRotationPlan,
  RotationKeyStatus,
  RotationPolicy,
  TrustStore,
  TrustStoreTransition
} from "./types.js";

function ageDays(date:string,now:Date):number{
  return (now.getTime()-new Date(date).getTime())/(24*60*60*1000);
}

export function planKeyRotation(
  keys:AgentTrustKey[],
  purpose:AgentTrustKey["purpose"],
  policy:RotationPolicy,
  now=new Date()
):KeyRotationPlan{
  const scoped=keys.filter(key=>key.purpose===purpose);
  const active=scoped.filter(key=>key.status==="active");
  const staged=scoped.filter(key=>key.status==="staged");
  const retireKeyIds:string[]=[];
  const revokeKeyIds:string[]=[];
  const findings:string[]=[];

  for(const key of scoped){
    if(!policy.allowedAlgorithms.includes(key.algorithm)){
      findings.push(`${key.id}:ALGORITHM_NOT_ALLOWED`);
      revokeKeyIds.push(key.id);
    }
    if(key.compromised){
      findings.push(`${key.id}:KEY_COMPROMISED`);
      revokeKeyIds.push(key.id);
    }
  }

  for(const key of active){
    if(ageDays(key.createdAt,now)>=policy.maximumKeyAgeDays){
      findings.push(`${key.id}:KEY_MAXIMUM_AGE_REACHED`);
      retireKeyIds.push(key.id);
    }
  }

  if(active.length<policy.minimumTrustedKeys){
    findings.push("INSUFFICIENT_ACTIVE_KEYS");
  }

  if(retireKeyIds.length>0 && staged.length===0){
    findings.push("NO_STAGED_REPLACEMENT_KEY");
  }

  const emergency=revokeKeyIds.length>0;
  const rotate=
    retireKeyIds.length>0 ||
    active.length<policy.minimumTrustedKeys ||
    staged.length>0;

  return{
    purpose,
    currentKeyIds:active.map(key=>key.id),
    stagedKeyIds:staged.map(key=>key.id),
    retireKeyIds:[...new Set(retireKeyIds)],
    revokeKeyIds:[...new Set(revokeKeyIds)],
    findings,
    decision:emergency
      ?"emergency-rotate"
      :rotate
        ?"rotate"
        :"healthy"
  };
}

export function applyTrustStoreTransition(
  store:TrustStore,
  keys:AgentTrustKey[],
  plan:KeyRotationPlan,
  now=new Date()
):TrustStoreTransition{
  const activatedKeyIds=plan.stagedKeyIds.filter(id=>{
    const key=keys.find(item=>item.id===id);
    return key && new Date(key.activatesAt).getTime()<=now.getTime();
  });

  const revokedKeyIds=[...new Set([
    ...store.revokedKeyIds,
    ...plan.revokeKeyIds
  ])];

  const retiredKeyIds=plan.retireKeyIds.filter(id=>{
    const key=keys.find(item=>item.id===id);
    return !key?.retiresAt || new Date(key.retiresAt).getTime()<=now.getTime();
  });

  const trustedKeyIds=[...new Set([
    ...store.trustedKeyIds,
    ...activatedKeyIds
  ])].filter(id=>
    !revokedKeyIds.includes(id) &&
    !retiredKeyIds.includes(id)
  );

  return{
    nextStore:{
      ...store,
      trustedKeyIds,
      revokedKeyIds,
      version:store.version+1
    },
    activatedKeyIds,
    retiredKeyIds,
    revokedKeyIds:plan.revokeKeyIds
  };
}

export function validateTrustStore(
  store:TrustStore,
  keys:AgentTrustKey[],
  minimumTrustedKeys:number
):string[]{
  const findings:string[]=[];
  const knownIds=new Set(keys.map(key=>key.id));

  for(const id of store.trustedKeyIds){
    if(!knownIds.has(id))findings.push(`${id}:UNKNOWN_TRUST_KEY`);
    if(store.revokedKeyIds.includes(id)){
      findings.push(`${id}:TRUSTED_AND_REVOKED`);
    }
  }

  if(store.trustedKeyIds.length<minimumTrustedKeys){
    findings.push("TRUST_STORE_BELOW_MINIMUM");
  }

  return findings;
}

export function createKeyRotationSummary(plan:KeyRotationPlan):string{
  return[
    `Key rotation decision: ${plan.decision}`,
    `Purpose: ${plan.purpose}`,
    `Active keys: ${plan.currentKeyIds.length}`,
    `Staged keys: ${plan.stagedKeyIds.length}`,
    `Retiring keys: ${plan.retireKeyIds.length}`,
    `Revoked keys: ${plan.revokeKeyIds.length}`
  ].join("\n");
}
