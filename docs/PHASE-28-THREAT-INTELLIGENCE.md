# Phase 28 — Threat Intelligence

Adds deterministic local threat-intelligence enrichment.

Included:
- IPv4, IPv6, domain, URL, hash and email indicators
- normalized IOC matching
- confidence and severity scoring
- expiry handling
- STIX-like indicator import
- observable enrichment
- allow, warn and block decision
- unit tests
- root verification integration

Indicators and STIX-like objects can be supplied as local JSON.
No TAXII server, threat-feed API key, subscription or paid service is required.
