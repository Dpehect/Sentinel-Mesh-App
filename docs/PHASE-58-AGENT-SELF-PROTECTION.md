# Phase 58 — Agent Self-Protection

Adds deterministic tamper and self-protection controls.

Included:
- unauthorized service-stop detection
- uninstall-attempt detection
- debugger-attachment detection
- protected binary and configuration paths
- unauthorized file and permission-change detection
- watchdog-loss reporting
- approved maintenance windows
- restore-target generation
- agent quarantine decisions
- unit tests
- root verification integration

The module detects and evaluates tampering; it does not execute arbitrary operating-system commands.
