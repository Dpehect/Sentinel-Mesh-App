# Phase 51 — Distributed Scan Nodes

Adds deterministic distributed scan orchestration.

Included:
- regional scan nodes
- tenant and capability-aware scheduling
- concurrency and capacity enforcement
- heartbeat and stale-node detection
- priority-based job assignment
- region preference scoring
- automatic job recovery after node failure
- healthy, degraded and blocked decisions
- unit tests
- root verification integration

All node and job state can be supplied as local JSON.
No queue service, cloud API or paid subscription is required.
