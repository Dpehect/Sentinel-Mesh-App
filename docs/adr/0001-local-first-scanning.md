# ADR 0001: Local-first scanning

## Status
Accepted

## Decision
Scanner binaries execute in the operator-controlled worker environment. Cloud AI providers are optional and no paid API is required.

## Consequences
Repository contents remain local by default, but operators must patch scanner binaries and enforce worker isolation.
