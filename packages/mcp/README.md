# @clearance/mcp

The MCP server that exposes the Clearance PMO system to MCP-compatible clients (Claude Code, Claude Desktop, Codex, Cursor, etc.). It connects to a Clearance Postgres database (`@clearance/schema`) and serves governed work-management tools.

## Status

Read-only tools and the operational digest are implemented. Mutating tools (claim, block, close with evidence, candidate/work-item creation, run packs) are the next increment.

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
