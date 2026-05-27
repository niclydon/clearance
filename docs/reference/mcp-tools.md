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

## Write Tools (planned)

| Tool | Purpose |
| --- | --- |
| `claim_next` | Claim the highest-priority eligible work item. |
| `claim_heartbeat` | Extend an active claim lease. |
| `close_verified` | Close a work item with evidence. |
| `block_with_child` | Create blocker child work, block parent, and release claim. |
| `create_work_item` | Create accepted work when authorized. |
| `update_work_item` | Update status, tags, priority, body, and notes. |
| `create_candidate` | File proposed work for review. |
| `run_pack_create` | Create a scoped execution list. |
| `run_pack_record` | Record per-item run-pack disposition. |

## Later Tools

| Tool | Purpose |
| --- | --- |
| `investigate` | Record structured investigation disposition. |
| `precondition_check` | Verify machine-checkable preconditions. |
| `project_tracks` | Manage and inspect project tracks. |
| `decision_thread` | Create and resolve decision threads. |

## Tool Contract Expectations

Tools should declare whether they are read-only or mutating. Mutating tools should record provenance and return enough structured data for a caller to show what changed.

## Current Status

The read tools and `digest` are implemented and tested in `@clearance/mcp` (paginated, read-only, verified via an in-memory MCP client round-trip). The write tools are the next increment.
