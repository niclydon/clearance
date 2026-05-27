# Decision Records

This page is the durable record of settled founding decisions for Clearance. Each record names the date it was settled, the choice, and the reasoning behind it.

The [founding plan](../founding-plan.md) introduced these as open recommendations. Once a recommendation is settled here, the founding plan points to this page rather than restating the rationale.

A decision is "settled" when it is safe for a future contributor to build on it without re-litigating the choice. Settled decisions can still be revisited, but only deliberately, with a new dated record that supersedes the old one.

## Settled 2026-05-27 — v1 founding decisions

The following six recommendations from the founding plan, plus the package manager and package-naming choices needed to scaffold the repository, were settled together on 2026-05-27. They unblock repository scaffolding and all later v1 implementation work.

### License: Apache 2.0

Clearance is released under Apache License 2.0.

Rationale: Apache 2.0 favors broad adoption by individuals, teams, and companies who may embed Clearance inside their own internal systems. It grants a patent license and is permissive enough that a company can run Clearance as operational infrastructure without legal friction, while still requiring attribution and preservation of notices.

### Package manager and monorepo shape: npm workspaces

Clearance is a single monorepo managed with npm workspaces. There is no pnpm, yarn, or external monorepo tool in v1.

Rationale: the planned packages are few and tightly related, and npm workspaces ship with the Node.js toolchain every contributor already has. Choosing the lowest-friction option keeps the contribution barrier low and avoids committing the public project to a heavier tool before the package count justifies it. A different tool can be adopted later if the package graph grows.

### Package names and npm scope: `@clearance/*`

The published packages live under the `@clearance` npm scope:

- `@clearance/schema` — Postgres schema, migrations, seed data, and generated types.
- `@clearance/mcp` — the MCP server that exposes the PMO system.
- `@clearance/contracts` — reusable role and operating contracts.
- `@clearance/bot-discord` — the optional review-surface adapter, added later and never a core dependency.

Rationale: a shared scope makes the project legible as one system and reserves a clean namespace. The first three packages map directly to the v1 product layers in the founding plan; the Discord adapter is named now so the boundary is clear, but it is explicitly optional and out of the core install path.

### Storage: Postgres only for v1

Clearance v1 targets PostgreSQL exclusively. No SQLite or alternate storage adapter is committed for v1.

Rationale: the PMO model depends on transactional claim selection, JSONB metadata, check constraints, and safe concurrent worker coordination. Building those on Postgres first keeps the contract honest. A storage-adapter abstraction is future work that should only be attempted after the PMO contract is stable, so it can be designed against a known-good reference rather than guessed at up front.

### Tag extensibility: reserved system tags plus a documented custom namespace

Clearance ships a fixed set of core governance tags as reserved system tags. Users may add their own tags within a documented custom namespace, but may not redefine or collide with the reserved tags.

Rationale: the governance tags are the permission and routing layer for work, so their meaning must be stable and trustworthy across every Clearance deployment. Reserving them protects that contract. A documented custom namespace still lets operators model environment-specific routing without forking the core vocabulary.

### Interface surface: MCP first, REST and dashboard out of v1

The MCP server is the primary and only shipped interface for v1. REST APIs, web dashboards, and hosted-deployment surfaces are out of scope for v1.

Rationale: MCP is the interface the source system proved under real use, and it serves humans, agents, and tools through one contract. Shipping it first keeps v1 focused on the work-management substrate rather than UI surface area. REST can be added later for dashboards, integrations, and hosted deployments once the tool contract is settled.

### Review bot: optional, never required

Human review surfaces — starting with the Discord adapter — are optional. Core Clearance is fully usable through MCP and CLI workflows with no chat platform attached.

Rationale: a PMO system should not require Discord or Slack to be useful. Making the review surface optional keeps the core portable across environments and prevents a chat dependency from leaking into the substrate. The Discord adapter exists because that is where the workflow was proven, not because it is a prerequisite.

## Still open

### Nexus relationship

The founding plan recommends that Clearance becomes the generic upstream once stable, with Nexus later consuming it plus Nexus-specific extensions. This remains a standing recommendation rather than a settled decision: it does not block v1 scaffolding or implementation, and it depends on Clearance reaching stability before the consumption direction can be committed. It will get its own dated record when it is settled.

## Provenance

The 2026-05-27 decisions were made by the operator in response to the founding-decisions workstream (tracked as OB-881 in the originating Nexus backlog). The recommendations they ratify were drafted in the founding plan during Phase 0 documentation.
