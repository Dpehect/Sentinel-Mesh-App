# Phase 23 — Secret Detection Engine

Adds deterministic local secret detection.

Included:
- GitHub token detection
- Google API key detection
- OpenAI key detection
- AWS access-key detection
- private-key detection
- generic credential detection
- high-entropy token analysis
- safe masked output
- confidence-based merge blocking
- deterministic fingerprints
- unit tests
- root verification integration

Detected secret values are never returned in full.
No API key, cloud scanner, subscription or paid service is required.
