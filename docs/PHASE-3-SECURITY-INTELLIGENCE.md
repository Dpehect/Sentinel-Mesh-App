# Phase 3 — Security Intelligence Engine

This phase replaces regex-only analysis with a TypeScript compiler AST pipeline and framework-aware discovery.

## Implemented

- Next.js Route Handler discovery for GET/POST/PUT/PATCH/DELETE exports
- Express-style app/router endpoint discovery
- authentication-boundary heuristics
- source-to-sink correlation for request body, query, params, headers and form data
- command injection, raw SQL injection, SSRF, path traversal, open redirect and dynamic-code execution findings
- database, runtime-secret, dependency, container and workflow assets
- CWE and OWASP mappings
- duplicate finding correlation
- AST evidence with file, line and source excerpts
- scanner unit fixture

## Security boundary

The analyzer parses source text only. It does not execute repository code or install repository dependencies.
