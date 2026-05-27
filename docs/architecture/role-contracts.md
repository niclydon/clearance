# Role Contract Architecture

Role contracts define how work should be handled.

They are Markdown operating contracts and prompt templates, not standalone workers. A user can adapt them to Claude Code, Codex, Cursor, Aider, shell scripts, or a custom agent runtime.

## Planned Contracts

Clearance should ship contracts for:

- ProjectManager: discovery, triage, candidate filing, reporting, review preparation.
- ProjectWorker: scoped execution, claim handling, verification, blocking, verified close.
- ProjectInvestigator: diagnosis, routing, evidence gathering, no-code closure.

## Why Contracts Are Separate

Keeping role contracts separate from the MCP server makes Clearance portable.

The database and tools enforce core invariants. The contracts teach different actors how to operate within those invariants.

## Current Status

Contracts are planned. The generic versions will be extracted after the schema and tool contract are stable enough to reference exact behavior.
