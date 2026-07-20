import type {
  RuntimeAttestation,
  RuntimeAttestationPolicy,
  RuntimeAttestationReport,
  RuntimeAttestationState,
  RuntimeBaseline
} from "./types.js";

export type {
  RuntimeAttestation,
  RuntimeAttestationPolicy,
  RuntimeAttestationReport,
  RuntimeAttestationState,
  RuntimeBaseline
} from "./types.js";

function compareVersions(left:string,right:string):number{
  const a=left.split(".").map(value=>Number.parseInt(value,10)||0);
  const b=right.split(".").map(value=>Number.parseInt(value,10)||0);
  const length=Math.max(a.length,b.length);

  for(let index=0;index<length;index+=1){
    const av=a[index]??0;
    const bv=b[index]??0;
    if(av>bv)return 1;
    if(av<bv)return -1;
  }

  return 0;
}

export function evaluateRuntimeAttestation(
  baseline:RuntimeBaseline,
  state:RuntimeAttestationState,
  attestation:RuntimeAttestation,
  policy:RuntimeAttestationPolicy,
  now=new Date()
):RuntimeAttestationReport{
  const findings:string[]=[];

  if(attestation.tenantId!==baseline.tenantId || attestation.tenantId!==state.tenantId){
    findings.push("TENANT_MISMATCH");
  }
  if(attestation.agentId!==baseline.agentId || attestation.agentId!==state.agentId){
    findings.push("AGENT_MISMATCH");
  }
  if(attestation.platform!==baseline.platform){
    findings.push("PLATFORM_MISMATCH");
  }
  if(!policy.trustedSigners.includes(attestation.signerId)){
    findings.push("UNTRUSTED_SIGNER");
  }
  if(attestation.signature.length<32){
    findings.push("INVALID_SIGNATURE");
  }
  if(state.usedNonces.includes(attestation.nonce)){
    findings.push("NONCE_REPLAY");
  }

  const issuedAt=new Date(attestation.issuedAt).getTime();
  const expiresAt=new Date(attestation.expiresAt).getTime();
  const current=now.getTime();

  if(current<issuedAt) findings.push("ATTESTATION_NOT_YET_VALID");
  if(current>expiresAt) findings.push("ATTESTATION_EXPIRED");
  if((expiresAt-issuedAt)/1000>policy.maxLifetimeSeconds){
    findings.push("ATTESTATION_LIFETIME_TOO_LONG");
  }

  if(!baseline.approvedBinaryHashes.includes(attestation.binaryHash)){
    findings.push("UNAPPROVED_AGENT_BINARY");
  }
  if(baseline.secureBootRequired&&!attestation.secureBootEnabled){
    findings.push("SECURE_BOOT_DISABLED");
  }
  if(baseline.tpmRequired&&!attestation.tpmPresent){
    findings.push("TPM_NOT_PRESENT");
  }
  if(compareVersions(attestation.agentVersion,baseline.minimumAgentVersion)<0){
    findings.push("AGENT_VERSION_TOO_OLD");
  }

  const unknownModules=attestation.loadedModuleHashes.filter(
    hash=>!baseline.approvedModuleHashes.includes(hash)
  );

  if(unknownModules.length>policy.maximumUnknownModules){
    findings.push("UNKNOWN_RUNTIME_MODULES");
  }

  const reject=findings.some(item=>[
    "TENANT_MISMATCH",
    "AGENT_MISMATCH",
    "UNTRUSTED_SIGNER",
    "INVALID_SIGNATURE",
    "NONCE_REPLAY",
    "ATTESTATION_EXPIRED",
    "ATTESTATION_NOT_YET_VALID"
  ].includes(item));

  const trusted=findings.length===0;

  return{
    findings,
    unknownModules,
    trusted,
    nextState:trusted
      ?{
          ...state,
          usedNonces:[...state.usedNonces,attestation.nonce],
          lastAcceptedAt:attestation.issuedAt
        }
      :state,
    decision:reject
      ?"reject"
      :trusted
        ?"trust"
        :"quarantine"
  };
}

export function createRuntimeAttestationSummary(
  report:RuntimeAttestationReport
):string{
  return[
    `Runtime attestation decision: ${report.decision}`,
    `Trusted: ${report.trusted}`,
    `Findings: ${report.findings.length}`,
    `Unknown modules: ${report.unknownModules.length}`
  ].join("\n");
}
