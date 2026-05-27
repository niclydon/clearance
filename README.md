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

This repository is in the founding documentation phase. The docs describe the planned public system and the extraction boundary from the PMO system already used inside Nexus.

No runtime packages, schema migrations, MCP server, or bot adapters have landed yet.

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

Clearance is released under the Apache License 2.0. The `LICENSE` file lands with the repository scaffold. See [decision records](docs/architecture/decision-records.md) for the founding decisions that shape the project, including license, packaging, storage, and interface scope.
