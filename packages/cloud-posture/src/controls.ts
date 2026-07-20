import type {CloudControl} from "./types.js";
export const defaultCloudControls: CloudControl[] = [
 {id:"CSPM-STORAGE-001",title:"Public storage must be disabled",resourceTypes:["storage"],severity:"critical",evaluate:r=>r.configuration.publicAccess!==true,remediation:"Disable public access and require authenticated access."},
 {id:"CSPM-DATA-001",title:"Encryption at rest must be enabled",resourceTypes:["storage","database","secret-store"],severity:"high",evaluate:r=>r.configuration.encryptionAtRest===true,remediation:"Enable encryption at rest."},
 {id:"CSPM-NETWORK-001",title:"Administrative ports must not be internet exposed",resourceTypes:["network","compute"],severity:"critical",evaluate:r=>{const p=Array.isArray(r.configuration.publicPorts)?r.configuration.publicPorts:[];return !p.some(x=>[22,3389,5432,3306,6379].includes(Number(x)));},remediation:"Restrict administrative ports to private networks."},
 {id:"CSPM-IAM-001",title:"Wildcard permissions must be prohibited",resourceTypes:["identity"],severity:"critical",evaluate:r=>r.configuration.wildcardActions!==true && (r.configuration.admin!==true || r.configuration.mfaEnabled===true),remediation:"Apply least privilege and require MFA for administrators."},
 {id:"CSPM-LOGGING-001",title:"Security audit logging must be enabled",resourceTypes:["logging","compute","database","identity"],severity:"high",evaluate:r=>r.configuration.auditLogging===true,remediation:"Enable immutable audit logging."},
 {id:"CSPM-BACKUP-001",title:"Critical data services must have backups",resourceTypes:["database","storage"],severity:"high",evaluate:r=>r.configuration.criticalData!==true || r.configuration.backupEnabled===true,remediation:"Enable automated backups and test restores."}
];
