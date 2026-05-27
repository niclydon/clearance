# Changes

Chronological record of notable changes to Clearance. The founding documentation phase predates this file; entries begin where durable decisions and structure land.

## 2026-05-27

- Settled the v1 founding decisions (OB-881): Apache 2.0 license, npm-workspaces monorepo, `@clearance/*` package scope, Postgres-only storage for v1, reserved system tags plus a documented custom namespace, MCP-first interface with REST/dashboard out of v1, and an optional (never required) review bot. Added `docs/architecture/decision-records.md`, marked the founding plan's decisions as settled, and noted the license in the README.
- Mapped the Nexus PMO source system into a generic extraction plan (OB-882): added `docs/reference/extraction-map.md` — the table-by-table lineage matrix (15 core tables + decision threads + vocab), per-column keep/rename/genericize/drop decisions grounded in live schema inspection, the controlled vocabularies (8 reserved tags, 14 work types, link/relationship sets, status enums), the governance invariants to preserve (the two `work_items` CHECK constraints + the no-self-promotion rule), Nexus-specific behavior not extracted, and the open questions for schema implementation.
- Scaffolded the public repo workspace and baseline tooling (OB-883): npm-workspaces monorepo with placeholder `@clearance/schema`, `@clearance/mcp`, and `@clearance/contracts` packages (no runtime behavior yet); baseline checks via `npm run check` (Prettier format, ESLint, TypeScript typecheck, Vitest, and an offline relative-Markdown-link check in `scripts/check-links.mjs`); the Apache 2.0 `LICENSE`; `CONTRIBUTING.md`; and `.editorconfig`/`.prettierrc`/`.prettierignore` hygiene. A fresh clone runs `npm install && npm run check`.
