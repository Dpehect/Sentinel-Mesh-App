import type {ComplianceControl} from "./types.js";

export const controlCatalog: ComplianceControl[] = [
  {
    id:"SOC2-CC6.1",
    framework:"SOC2",
    title:"Logical access controls",
    description:"Restrict access using approved authorization controls.",
    requiredEvidenceTypes:["tenant-isolation","rbac","audit-log"]
  },
  {
    id:"SOC2-CC7.2",
    framework:"SOC2",
    title:"Security monitoring",
    description:"Monitor systems for security events and vulnerabilities.",
    requiredEvidenceTypes:["scan-result","attack-path","audit-log"]
  },
  {
    id:"ISO27001-A.8.8",
    framework:"ISO27001",
    title:"Management of technical vulnerabilities",
    description:"Identify, assess and remediate technical vulnerabilities.",
    requiredEvidenceTypes:["finding","sla","remediation"]
  },
  {
    id:"NIST-DE.CM-8",
    framework:"NIST-CSF",
    title:"Vulnerability scans",
    description:"Perform vulnerability scans and record results.",
    requiredEvidenceTypes:["scan-result"]
  },
  {
    id:"OWASP-ASVS-1.14",
    framework:"OWASP-ASVS",
    title:"Configuration verification",
    description:"Verify security controls and configurations.",
    requiredEvidenceTypes:["policy","scan-result","evidence"]
  }
];
