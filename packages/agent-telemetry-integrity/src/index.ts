import {createHash} from "node:crypto";
import type {
  AgentTelemetryState,
  TelemetryEnvelope,
  TelemetryIntegrityFinding,
  TelemetryIntegrityPolicy,
  TelemetryIntegrityReport
} from "./types.js";

export type {
  AgentTelemetryState,
  TelemetryEnvelope,
  TelemetryIntegrityFinding,
  TelemetryIntegrityPolicy,
  TelemetryIntegrityReport
} from "./types.js";

export function computeEnvelopeHash(
  envelope: Omit<TelemetryEnvelope,"envelopeHash">
): string {
  return createHash("sha256").update([
    envelope.id,
    envelope.tenantId,
    envelope.agentId,
    envelope.sequence,
    envelope.timestamp,
    envelope.payloadHash,
    envelope.previousEnvelopeHash ?? "",
    envelope.nonce
  ].join("|")).digest("hex");
}

export function verifyTelemetryBatch(
  state: AgentTelemetryState,
  envelopes: TelemetryEnvelope[],
  policy: TelemetryIntegrityPolicy,
  now = new Date()
): TelemetryIntegrityReport {
  const findings:TelemetryIntegrityFinding[] = [];
  const acceptedEnvelopeIds:string[] = [];
  const rejectedEnvelopeIds:string[] = [];
  const seenNonces = new Set(state.seenNonces);

  let lastSequence = state.lastSequence;
  let lastEnvelopeHash = state.lastEnvelopeHash;
  let lastTimestamp = state.lastTimestamp;

  const sorted = [...envelopes].sort((a,b)=>a.sequence-b.sequence);

  for(const envelope of sorted){
    const local:TelemetryIntegrityFinding[]=[];

    if(envelope.tenantId!==state.tenantId){
      local.push({envelopeId:envelope.id,code:"TENANT_MISMATCH"});
    }
    if(envelope.agentId!==state.agentId){
      local.push({envelopeId:envelope.id,code:"AGENT_MISMATCH"});
    }
    if(envelope.sequence<=lastSequence){
      local.push({envelopeId:envelope.id,code:"SEQUENCE_REPLAY"});
    }
    if(envelope.sequence-lastSequence>policy.maxSequenceGap){
      local.push({envelopeId:envelope.id,code:"SEQUENCE_GAP"});
    }
    if(seenNonces.has(envelope.nonce)){
      local.push({envelopeId:envelope.id,code:"NONCE_REPLAY"});
    }
    if(
      lastEnvelopeHash &&
      envelope.previousEnvelopeHash!==lastEnvelopeHash
    ){
      local.push({envelopeId:envelope.id,code:"HASH_CHAIN_BROKEN"});
    }

    const expected = computeEnvelopeHash({
      id:envelope.id,
      tenantId:envelope.tenantId,
      agentId:envelope.agentId,
      sequence:envelope.sequence,
      timestamp:envelope.timestamp,
      payloadHash:envelope.payloadHash,
      previousEnvelopeHash:envelope.previousEnvelopeHash,
      nonce:envelope.nonce
    });

    if(expected!==envelope.envelopeHash.toLowerCase()){
      local.push({envelopeId:envelope.id,code:"INVALID_HASH"});
    }

    const skew = Math.abs(
      now.getTime()-new Date(envelope.timestamp).getTime()
    )/1000;

    if(skew>policy.maxClockSkewSeconds){
      local.push({envelopeId:envelope.id,code:"CLOCK_SKEW"});
    }

    findings.push(...local);

    if(local.length===0){
      acceptedEnvelopeIds.push(envelope.id);
      lastSequence=envelope.sequence;
      lastEnvelopeHash=envelope.envelopeHash;
      lastTimestamp=envelope.timestamp;
      seenNonces.add(envelope.nonce);
    }else{
      rejectedEnvelopeIds.push(envelope.id);
    }
  }

  const severe = findings.some(item=>
    [
      "TENANT_MISMATCH",
      "AGENT_MISMATCH",
      "SEQUENCE_REPLAY",
      "NONCE_REPLAY",
      "HASH_CHAIN_BROKEN",
      "INVALID_HASH"
    ].includes(item.code)
  );

  return{
    acceptedEnvelopeIds,
    rejectedEnvelopeIds,
    findings,
    nextState:{
      ...state,
      lastSequence,
      lastEnvelopeHash,
      lastTimestamp,
      seenNonces:[...seenNonces]
    },
    decision:severe
      ?"reject"
      :findings.length>0
        ?"review"
        :"accept"
  };
}

export function createTelemetryIntegritySummary(
  report:TelemetryIntegrityReport
):string{
  return[
    `Telemetry integrity decision: ${report.decision}`,
    `Accepted envelopes: ${report.acceptedEnvelopeIds.length}`,
    `Rejected envelopes: ${report.rejectedEnvelopeIds.length}`,
    `Findings: ${report.findings.length}`
  ].join("\n");
}
