# Digest and Review Workflow

Clearance should make the state of work easy to inspect.

A digest is the PMO heartbeat: it tells an operator what is ready, blocked, active, stale, and recently completed.

## Useful Digest Sections

A good digest includes:

- ready work
- active claims
- expired or stale claims
- blocked work by blocker type
- candidates waiting for review
- recent completions
- projects with no recent movement
- decisions waiting on a human

## Review Rhythm

An operator might use Clearance in a daily rhythm:

1. Read the digest.
2. Review new candidates.
3. Approve safe work.
4. Answer decision threads.
5. Check blocked items with satisfied preconditions.
6. Launch a worker loop or run pack.
7. Review closes and evidence.

## MCP tools

The `digest` tool returns the ready queue, blocked count, active and stale claims, pending candidates, and recent completions. The review rhythm uses `digest` (step 1), `list_work_item_candidates` + `create_work_item` (steps 2–3), `update_work_item` with `operator_grant` to approve safe work (step 3), `claim_next` / `run_pack_create` to launch execution (step 6), and `list_claims` / `get_work_item` to review closes (step 7). See the [MCP tools reference](../reference/mcp-tools.md).

## Current Status

The `digest` tool is implemented in `@clearance/mcp`. The scheduled-posting review surface is a later optional layer.
