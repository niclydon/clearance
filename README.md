# Clearance

Clearance is a portable PMO and work-management system for people operating complex technical systems.

It is for the person or team running a homelab, software platform, research environment, automation stack, internal tooling platform, or similarly active system where work is constantly being discovered, triaged, blocked, delegated, verified, and closed.

Clearance gives that work a durable operating model:

- projects and workstreams that stay visible over time
- candidate work that can be reviewed before it becomes real backlog
- work items with status, priority, context, provenance, and evidence
- tags that make execution rules explicit
- claims and leases so two workers do not collide
- blockers, preconditions, and decision threads so work stops for the right reasons
- verified close so "done" means there is evidence

Clearance can be used by humans, automation, and AI coding agents. Agent execution is an important use case, but Clearance is broader than agent governance: it is the project office for a live technical system.

## Current Status

The v1 core is implemented and tested:

- **`@clearance/schema`** — the Postgres PMO substrate: numbered migrations from an empty database, seeded governance tags / work types / surfaces / link relationships, an `applyMigrations` runner, generated types, and a `clearance` migrate/status CLI.
- **`@clearance/mcp`** — an MCP server (stdio) with read tools + `digest` and the mutating tools (intake, claims, blocking, verified close, run packs), enforcing the governance model (agents cannot self-grant `autonomous_safe`; verified close requires evidence).
- **`@clearance/contracts`** — generic ProjectManager / ProjectWorker / ProjectInvestigator contracts and a reusable worker-loop prompt.

Not yet built: the optional Discord review surface and a REST API (out of v1). See [CHANGES.md](CHANGES.md) for detail.

## Quick start

Requires PostgreSQL 14+ and Node 20+.

```bash
npm install
npm run build

# Install the schema into a fresh database.
createdb clearance
DATABASE_URL=postgres://localhost/clearance npx clearance migrate

# Point an MCP client (Claude Code, Codex, Cursor, ...) at the server:
#   { "mcpServers": { "clearance": { "command": "npx", "args": ["@clearance/mcp"],
#     "env": { "DATABASE_URL": "postgres://localhost/clearance" } } } }
```

See [first setup](docs/guides/first-setup.md) for the full walkthrough and [examples/dogfood](examples/dogfood/) for a complete lifecycle run.

## Start Here

- [Founding plan](docs/founding-plan.md): the product plan and implementation sequence.
- [Documentation map](docs/README.md): reader paths for users, builders, maintainers, and future agents.
- [Concepts](docs/concepts/README.md): the PMO model Clearance uses.
- [Architecture](docs/architecture/README.md): planned packages and system boundaries.
- [Guides](docs/guides/README.md): practical workflows as the product takes shape.
- [Reference](docs/reference/README.md): tables, tags, tools, evidence, roles, and source design material.
- [Contributing](docs/contributing/README.md): documentation and implementation standards.

## Origin

Clearance is the public, standalone extraction of the PMO/work-management system developed inside Nexus. The Nexus history matters because it proves the model under real operational pressure, but Clearance is not a Nexus-only tool. It is intended to be usable by anyone managing a complex technical system.

## License

Clearance is released under the [Apache License 2.0](LICENSE). See [decision records](docs/architecture/decision-records.md) for the founding decisions that shape the project, including license, packaging, storage, and interface scope.
