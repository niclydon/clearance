# Contributing to Clearance

Clearance is in its founding phase. Most work right now is documentation and the schema/MCP scaffolding described in the [founding plan](docs/founding-plan.md). The settled founding decisions live in [decision records](docs/architecture/decision-records.md).

## Documentation and implementation standards

- [Documentation standards](docs/contributing/documentation-standards.md)
- [Implementation workflow](docs/contributing/implementation-workflow.md)

## Repository layout

- `packages/` — npm workspaces for the planned packages (`@clearance/schema`, `@clearance/mcp`, `@clearance/contracts`). These are scaffolded but not implemented yet.
- `docs/` — product documentation, concepts, architecture, guides, reference, and decision records.
- `scripts/` — repository tooling.

## Baseline checks

A fresh clone can run the baseline checks after installing dependencies:

```bash
npm install
npm run check
```

`npm run check` runs, in order:

- `npm run format` — Prettier formatting check over code and config.
- `npm run lint` — ESLint over the packages.
- `npm run typecheck` — TypeScript type checking.
- `npm run test` — Vitest (passes with no tests until tests land).
- `npm run check:links` — validates that relative Markdown links resolve.

Run `npm run format:write` to apply formatting fixes.

## License

By contributing you agree that your contributions are licensed under the [Apache License 2.0](LICENSE).
