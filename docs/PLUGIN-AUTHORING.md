# Plugin authoring

Scanner plugins implement the `ScannerPlugin` interface from `@sentinel/plugin-sdk`.

Requirements:

- deterministic IDs and fingerprints;
- no network access by default;
- bounded execution time;
- normalized evidence with file paths;
- explicit scanner version;
- tests using local fixtures;
- no destructive repository operations.

Use `examples/plugin-starter` as the minimum reference implementation.
