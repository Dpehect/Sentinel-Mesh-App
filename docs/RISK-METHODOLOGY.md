# Risk methodology

Sentinel Mesh uses an explainable 0–100 path score composed from:

- Finding severity: 19%
- Estimated exploitability: 18%
- Public exposure: 12%
- Required initial privilege: 8%
- Evidence confidence: 10%
- Target criticality and data sensitivity: 20%
- Graph reachability and transition risk: 13%

Scores are intended for prioritization inside one organization. They are not calibrated as CVSS replacements and should not be compared across unrelated organizations without normalization.

Duplicate findings are collapsed by fingerprint before the repository security score is calculated. Attack paths are deduplicated by ordered asset sequence.
