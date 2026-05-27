# First Setup

This guide describes the intended v1 setup path. It is not runnable yet.

## Goal

A new user should be able to install Clearance into a fresh Postgres database and connect the MCP server from their agent or tool client.

## Planned Flow

1. Install the schema and MCP packages.
2. Create a Postgres database.
3. Run Clearance migrations.
4. Configure the MCP server with `DATABASE_URL`.
5. Create the first project track.
6. Create or review the first work item.
7. Read the first digest.

## Example Shape

```bash
createdb clearance
npx clearance migrate
```

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

The command names and package names are planned. They should be verified and updated once implementation begins.
