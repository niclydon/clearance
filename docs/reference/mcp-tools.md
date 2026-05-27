# MCP Tools Reference

This page lists the planned MCP tools.

## Read Tools (implemented in `@clearance/mcp`)

| Tool | Purpose |
| --- | --- |
| `list_work_items` | Query work items with status / tag / work_type / category filters (paginated). |
| `get_work_item` | Fetch a single work item by id. |
| `list_work_item_candidates` | List proposed work awaiting review. |
| `list_project_tracks` | List durable project tracks. |
| `list_claims` | List worker claims/leases. |
| `list_run_packs` | List scoped execution batches. |
| `digest` | Summarize ready, blocked, active/stale claims, pending candidates, and recent completions. |

## Write Tools (implemented in `@clearance/mcp`)

| Tool | Purpose |
| --- | --- |
| `create_candidate` | File proposed work for review (candidate-first). |
| `promote_candidate` | Promote a candidate to a work item (with optional overrides), mark it approved, and link them. |
| `reject_candidate` | Mark a candidate rejected. |
| `create_work_item` | Create accepted work. `autonomous_safe` requires `operator_grant`. |
| `update_work_item` | Update status, priority, body, notes, work_type, and add/remove tags (audited). |
| `claim_next` | Claim the highest-priority eligible work item (expires stale claims, one active claim per item, race-safe). |
| `claim_heartbeat` | Extend an active claim lease. |
| `block_with_child` | Create a blocker child, block the parent (demoting `autonomous_safe`), link them, release the claim. |
| `close_verified` | Close a work item; requires evidence for tests, smoke, deploy, docs, migration, no_code. |
| `run_pack_create` | Create a scoped, ordered execution list (a scoping instruction, never a safety grant). |
| `run_pack_record` | Record per-item run-pack disposition. |
| `create_project_track` / `update_project_track` | Create/update a durable project track. |
| `create_project_track_link` | Link a track to a work item, candidate, repo, doc, or external reference. |

**Governance enforcement:** `create_work_item` / `update_work_item` reject applying `autonomous_safe` unless `operator_grant=true` (agents cannot self-promote); `block_with_child` removes `autonomous_safe` on the parent; `run_pack_record` never changes a work item's tags. Governance failures return an `isError` tool result with a clear message.

## Later Tools

| Tool | Purpose |
| --- | --- |
| `investigate` | Record structured investigation disposition. |
| `precondition_check` | Verify machine-checkable preconditions. |
| `decision_thread` | Create and resolve decision threads. |

## Tool Contract Expectations

Tools should declare whether they are read-only or mutating. Mutating tools should record provenance and return enough structured data for a caller to show what changed.

## Current Status

The full v1 tool set — read tools, `digest`, and the mutating tools (intake, claims, blocking, verified close, run packs) — is implemented and tested in `@clearance/mcp`, including governance enforcement (no agent self-promotion to `autonomous_safe`) and verified-close evidence validation.
