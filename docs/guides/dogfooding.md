# Dogfooding

Clearance should prove itself outside Nexus before public launch.

## Goal

Run the standalone Clearance schema and MCP server against a separate project or system, then use it to manage real work.

## Candidate Dogfood Environments

Useful dogfood targets include:

- a small homelab service
- a documentation-heavy repo
- a recurring publishing or automation workflow
- a non-Nexus software project with real backlog and blockers

## What To Prove

The dogfood run should prove:

- a fresh install works
- project tracks are useful
- candidates can be reviewed and promoted
- workers can claim and close work
- blockers preserve context
- digests help the operator decide what to do next
- docs are sufficient for someone not carrying the Nexus context

## First dogfood run (2026-05-27)

The first dogfood was a **self-contained example consumer** (no Nexus, no other live project): a script that embeds `@clearance/schema` and `@clearance/mcp` and drives a full lifecycle against a throwaway `clearance_demo` database. It is runnable at [examples/dogfood/run.mjs](../../examples/dogfood/run.mjs).

### Runbook

```bash
npm run build
createdb clearance_demo
DATABASE_URL=postgres://localhost/clearance_demo node examples/dogfood/run.mjs
```

### What it proved

- A fresh install works: `applyMigrations` builds the full schema from an empty database.
- Candidate-first holds: `create_candidate` files a proposal without creating a work item.
- The governance guardrail holds: an agent's attempt to add `autonomous_safe` is rejected; only an `operator_grant` adds it.
- A worker can `claim_next` an eligible item and `close_verified` it with evidence.
- A blocker preserves context: `block_with_child` blocks + demotes the parent and files a linked blocker child.
- `digest` gives an accurate snapshot (ready / blocked / claims / pending candidates / recent completions).

Every step ran through the published package APIs exactly as an external consumer would call them — confirming Clearance manages work outside its birthplace with no Nexus-specific assumptions.

### Gaps found

The run surfaced two real gaps, filed as follow-up work:

- **No candidate-promotion tool.** Promoting a candidate to a work item is two manual steps today (`create_work_item`, then the candidate stays `pending`); a `promote_candidate` tool should create the work item, mark the candidate `approved`, and set `created_work_item_id` atomically.
- **No project-track CRUD tool.** Project tracks must be created via SQL; the MCP server has no track create/update/link tool yet (the design doc lists `project_tracks` as a later tool).

Neither blocks the core worker lifecycle, which is fully usable today.

## Current Status

First dogfood complete (self-contained example). A dogfood against a separate real project (e.g. a publishing/automation workflow) remains a good future exercise.
