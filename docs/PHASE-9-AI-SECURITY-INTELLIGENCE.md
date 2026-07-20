# Phase 9 — AI Security Intelligence

This phase adds a zero-cost, local-first intelligence layer. It is not a chatbot and does not require a cloud API key.

## Capabilities

- hashed semantic vectors generated locally from finding evidence
- duplicate and related-finding clustering
- root-cause family extraction
- explainable false-positive probability signals
- remediation review priority scoring
- scan trend projection model
- authenticated intelligence API and console page

## Design boundaries

The intelligence engine never executes repository code and never sends source code to an external model. The implementation is deterministic, testable and provider-independent. A future ONNX or Ollama provider can implement the same report contract without changing the UI.

## Limitations

The hashed-vector model is intentionally lightweight. It improves triage and grouping, but it must not automatically suppress a security finding or replace human verification.
