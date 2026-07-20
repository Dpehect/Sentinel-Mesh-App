export type ScannerCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: "SAST" | "Secrets" | "Dependencies" | "Infrastructure" | "Custom";
  status: "bundled" | "optional" | "example";
  command?: string;
  capabilities: string[];
};

export const scannerCatalog: ScannerCatalogItem[] = [
  {id:"builtin",name:"Sentinel AST Engine",description:"Framework-aware TypeScript/JavaScript analysis with endpoint, trust-boundary and source-to-sink evidence.",category:"SAST",status:"bundled",capabilities:["AST","CWE mapping","OWASP mapping","attack graph evidence"]},
  {id:"semgrep",name:"Semgrep",description:"Optional community SAST adapter normalized into Sentinel findings.",category:"SAST",status:"optional",command:"semgrep",capabilities:["community rules","JSON adapter","incremental scope"]},
  {id:"gitleaks",name:"Gitleaks",description:"Optional committed-secret detection with fingerprint correlation.",category:"Secrets",status:"optional",command:"gitleaks",capabilities:["secret discovery","fingerprints","history-safe no-git mode"]},
  {id:"osv",name:"OSV-Scanner",description:"Optional open-source dependency vulnerability intelligence.",category:"Dependencies",status:"optional",command:"osv-scanner",capabilities:["OSV database","lockfile discovery","package evidence"]},
  {id:"example",name:"Example Scanner Plugin",description:"Reference implementation for the public ScannerPlugin SDK.",category:"Custom",status:"example",capabilities:["SDK contract","finding normalization","local execution"]}
];

export const benchmarkSamples = [
  {fixture:"Small Next.js app",files:148,durationMs:1240,findings:6,memoryMb:118},
  {fixture:"Express API",files:412,durationMs:2670,findings:14,memoryMb:164},
  {fixture:"Monorepo fixture",files:1230,durationMs:7190,findings:29,memoryMb:246}
];
