import {createHash} from "node:crypto";
import type {
  AgentSecret,
  SecretLease,
  SecretLeaseRequest,
  SecretVaultPolicy,
  SecretVaultReport
} from "./types.js";

export type {
  AgentSecret,
  SecretLease,
  SecretLeaseRequest,
  SecretStatus,
  SecretVaultPolicy,
  SecretVaultReport
} from "./types.js";

export function authorizeSecretLease(
  secret:AgentSecret|undefined,
  request:SecretLeaseRequest,
  policy:SecretVaultPolicy,
  usedNonces:string[],
  now=new Date()
):{allowed:boolean;reason?:string;lease?:SecretLease}{
  if(!secret)return{allowed:false,reason:"SECRET_NOT_FOUND"};
  if(secret.tenantId!==request.tenantId)return{allowed:false,reason:"TENANT_MISMATCH"};
  if(!secret.allowedAgentIds.includes(request.agentId)){
    return{allowed:false,reason:"AGENT_NOT_AUTHORIZED"};
  }
  if(secret.status!=="active")return{allowed:false,reason:"SECRET_NOT_ACTIVE"};
  if(secret.expiresAt && now.getTime()>=new Date(secret.expiresAt).getTime()){
    return{allowed:false,reason:"SECRET_EXPIRED"};
  }
  if(request.leaseSeconds<=0 || request.leaseSeconds>policy.maximumLeaseSeconds){
    return{allowed:false,reason:"INVALID_LEASE_DURATION"};
  }
  if(usedNonces.includes(request.nonce))return{allowed:false,reason:"NONCE_REPLAY"};

  const issuedAt=new Date(request.requestedAt);
  const expiresAt=new Date(issuedAt.getTime()+request.leaseSeconds*1000);
  const id=createHash("sha256")
    .update(`${request.tenantId}|${request.agentId}|${request.secretId}|${request.nonce}`)
    .digest("hex")
    .slice(0,20);

  return{
    allowed:true,
    lease:{
      id:`lease_${id}`,
      tenantId:request.tenantId,
      agentId:request.agentId,
      secretId:secret.id,
      secretVersion:secret.version,
      issuedAt:issuedAt.toISOString(),
      expiresAt:expiresAt.toISOString(),
      nonce:request.nonce
    }
  };
}

export function evaluateSecretVault(
  secrets:AgentSecret[],
  policy:SecretVaultPolicy,
  now=new Date()
):SecretVaultReport{
  const rotationSecretIds:string[]=[];
  const revokedSecretIds:string[]=[];
  const expiredSecretIds:string[]=[];
  const invalidEncryptionSecretIds:string[]=[];

  for(const secret of secrets){
    if(secret.status==="revoked")revokedSecretIds.push(secret.id);
    if(
      secret.status==="expired" ||
      (secret.expiresAt && now.getTime()>=new Date(secret.expiresAt).getTime())
    )expiredSecretIds.push(secret.id);

    const ageDays=(now.getTime()-new Date(secret.createdAt).getTime())/(24*60*60*1000);
    if(
      secret.status==="rotating" ||
      (secret.rotationDueAt && now.getTime()>=new Date(secret.rotationDueAt).getTime()) ||
      ageDays>=policy.maximumSecretAgeDays
    )rotationSecretIds.push(secret.id);

    if(
      !policy.allowedKeyIds.includes(secret.keyId) ||
      !secret.ciphertext.startsWith("enc:")
    )invalidEncryptionSecretIds.push(secret.id);
  }

  const blocking=
    revokedSecretIds.length>0 ||
    expiredSecretIds.length>0 ||
    invalidEncryptionSecretIds.length>0;

  return{
    rotationSecretIds:[...new Set(rotationSecretIds)],
    revokedSecretIds,
    expiredSecretIds,
    invalidEncryptionSecretIds,
    decision:blocking
      ?"block"
      :rotationSecretIds.length>0
        ?"rotate"
        :"healthy"
  };
}

export function detectPlaintextSecret(value:string):boolean{
  const normalized=value.trim();
  if(normalized.startsWith("enc:"))return false;
  return /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_\-]{12,}/i
    .test(normalized);
}

export function createSecretVaultSummary(report:SecretVaultReport):string{
  return[
    `Secret vault decision: ${report.decision}`,
    `Rotation required: ${report.rotationSecretIds.length}`,
    `Revoked secrets: ${report.revokedSecretIds.length}`,
    `Expired secrets: ${report.expiredSecretIds.length}`,
    `Invalid encryption: ${report.invalidEncryptionSecretIds.length}`
  ].join("\n");
}
