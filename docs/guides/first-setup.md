# First Setup

The schema install is runnable today (`@clearance/schema`). The MCP server steps are still planned.

## Goal

A new user should be able to install the Clearance schema into a fresh Postgres database and, once the MCP server lands, connect it from their agent or tool client.

## Schema setup (runnable now)

Requires PostgreSQL 14 or newer.

```bash
# 1. Create a database.
createdb clearance

# 2. Point Clearance at it.
export DATABASE_URL=postgres://localhost/clearance

# 3. Apply the migrations (creates all tables + seeds the reserved vocabularies).
npx clearance migrate

# 4. Verify what was applied.
npx clearance status
```

`clearance migrate` is idempotent — re-running it only applies migrations that are not yet recorded in `clearance_migrations`. `clearance status` prints the applied and pending migrations without changing anything. If `DATABASE_URL` is unset or wrong, both commands exit non-zero with a clear message.

## MCP server (planned)

Once `@clearance/mcp` lands, configure it with the same `DATABASE_URL`:

```json
{
  "mcpServers": {
    "clearance": {
      "command": "npx",
      "args": ["@clearance/mcp"],
      "env": {
        "DATABASE_URL": "postgres://localhost/clearance"
      }
    }
  }
}
```

Then create a project track, create or review the first work item, and read the first digest.

```json
{
  "mcpServers": {
    "clearance": {
      "command": "npx",
      "args": ["@clearance/mcp"],
      "env": {
        "DATABASE_URL": "postgres://localhost/clearance"
      }
    }
  }
}
```

## Current Status

The schema package and its `clearance migrate` / `clearance status` commands are implemented and tested against a fresh PostgreSQL database. The `@clearance/mcp` server is not implemented yet, so the MCP configuration above is still planned.
