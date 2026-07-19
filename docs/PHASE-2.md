# Phase 2 — Real Scanner Pipeline

Phase 2 replaces the fixed demo response with a real asynchronous repository scanning pipeline.

## Completed

- Public GitHub URL validation and safe coordinate parsing
- Shallow, non-interactive clone into a unique temporary workspace
- File-count and per-file byte limits
- Automatic cleanup in a `finally` block
- Built-in deterministic source scanner requiring no external API or binary
- Optional Semgrep adapter
- Optional Gitleaks adapter
- Optional OSV-Scanner adapter
- Common finding normalization model
- Deduplication and contextual risk scoring
- Lightweight asset inventory
- Attack-path correlation from highest-risk findings
- In-memory asynchronous scan jobs
- Polling endpoint for progress, logs and final result
- Dynamic scanner availability indicators

## Safety boundaries

- Only `https://github.com/owner/repository` public URLs are accepted.
- Git is launched through `execFile`; repository data is never inserted into a shell command.
- Clone operations are shallow and non-interactive.
- Scanner executions have timeouts and output-buffer limits.
- Temporary repositories are deleted after success or failure.
- This phase performs static defensive analysis only. It does not exploit targets or send active attack traffic.

## External scanners

The source ZIP intentionally excludes scanner binaries. Install them locally or build the scanner Docker image. The built-in scanner remains available when external tools are missing.
