# Governance Tags Reference

These are the planned reserved governance tags.

| Tag | Meaning | Primary actor |
| --- | --- | --- |
| `autonomous_safe` | Approved for execution without another human decision. | Worker |
| `requires_decision` | Human choice required. | Human |
| `requires_clickops` | Manual console or UI action required. | Human |
| `requires_investigation` | Premise needs diagnosis before execution. | Investigator |
| `requires_secret` | Credential or token required. | Human |
| `blocked_on_dependency` | Waiting on another item or upstream condition. | System or human |
| `observation_gate` | Waiting for time or future evidence. | Time or system |
| `deferred` | Parked by choice. | Human |

## Reserved Meaning

These tags should mean the same thing in every Clearance installation. Custom tags can add local context, but they should not redefine the reserved tags.

## Current Status

The vocabulary is planned seed data.
