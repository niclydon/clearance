# @clearance/mcp

The MCP server that exposes the Clearance PMO system to MCP-compatible clients (Claude Code, Claude Desktop, Codex, Cursor, etc.). It connects to a Clearance Postgres database (`@clearance/schema`) and serves governed work-management tools.

## Status

The full v1 tool set is implemented: read tools + digest, and the mutating tools (intake, claims, blocking, verified close, run packs) with governance enforcement.

## Read tools

| Tool | Purpose |
| --- | --- |
| `list_work_items` | List work items, filter by status / tag / work_type / category (paginated). |
| `get_work_item` | Fetch a single work item by id. |
| `list_work_item_candidates` | List proposed work awaiting review. |
| `list_project_tracks` | List durable project tracks. |
| `list_claims` | List worker claims/leases. |
| `list_run_packs` | List scoped execution batches. |
| `digest` | Snapshot: ready queue, blocked count, active/stale claims, pending candidates, recent completions. |

All list tools cap output at 200 rows (default 50) and accept `offset` for pagination. Read tools only issue `SELECT`s.

## Write tools

| Tool | Purpose |
| --- | --- |
| `create_candidate` | File proposed work for review (candidate-first). |
| `promote_candidate` / `reject_candidate` | Promote a candidate to a work item (and link it) or reject it. |
| `create_work_item` | Create accepted work. `autonomous_safe` requires `operator_grant`. |
| `update_work_item` | Update fields and add/remove governance tags (audited). |
| `claim_next` | Claim the highest-priority eligible work item (race-safe; expires stale claims). |
| `claim_heartbeat` | Extend an active claim lease. |
| `block_with_child` | Create a blocker child, block + demote the parent, link them, release the claim. |
| `close_verified` | Close with evidence for tests/smoke/deploy/docs/migration/no_code. |
| `run_pack_create` / `run_pack_record` | Create a scoped execution list and record per-item dispositions. |

Governance: agents cannot self-apply `autonomous_safe` (it needs `operator_grant=true`); run packs never grant safety. Governance/validation failures return an `isError` tool result.

## Running

```bash
DATABASE_URL=postgres://localhost/clearance npx clearance-mcp
```

Or in an MCP client config:

```json
{
  "mcpServers": {
    "clearance": {
      "command": "npx",
      "args": ["@clearance/mcp"],
      "env": { "DATABASE_URL": "postgres://localhost/clearance" }
    }
  }
}
```

`createServer(pool)` is also exported for embedding/testing.
