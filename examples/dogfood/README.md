# Dogfood example

A self-contained run that drives a full Clearance work lifecycle through the published `@clearance/schema` and `@clearance/mcp` packages — exactly as an external consumer embedding Clearance would — against a throwaway demo database.

## Run it

```bash
# From the repo root, with dependencies installed:
npm run build                       # build @clearance/schema and @clearance/mcp
createdb clearance_demo
DATABASE_URL=postgres://localhost/clearance_demo node examples/dogfood/run.mjs
```

The script refuses to run unless the database name contains `demo` (it resets the schema).

## What it exercises

1. Fresh install: reset schema + `applyMigrations`.
2. `create_candidate` — a manager files a candidate (no work item yet).
3. Promote the candidate to a work item (`create_work_item` + `update_work_item`).
4. Governance guardrail: an agent's attempt to self-grant `autonomous_safe` is rejected.
5. A human grants `autonomous_safe` with `operator_grant`.
6. `claim_next` — a worker claims the eligible item.
7. `close_verified` — closes with full evidence.
8. `block_with_child` — a second item hits a blocker; the parent is blocked + demoted and a blocker child is filed.
9. `digest` — the operator reads the snapshot.

See [docs/guides/dogfooding.md](../../docs/guides/dogfooding.md) for the captured transcript and the findings from the run.
