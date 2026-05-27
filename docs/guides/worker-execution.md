# Worker Execution

Worker execution is the controlled path from approved work to verified close.

## Safe Worker Loop

A worker should:

1. Ask Clearance for the next eligible item.
2. Claim the item.
3. Prepare an isolated execution context when code changes are needed.
4. Re-read the item, tags, project context, and known blockers.
5. Execute only the claimed scope.
6. Heartbeat the claim while working.
7. Verify the result.
8. Close with evidence or block with a linked child.

## Stop Conditions

A worker should stop when it encounters:

- a human decision
- missing secret
- manual clickops requirement
- unclear premise
- dependency not actually satisfied
- scope that has grown beyond the claimed item

## Evidence

The close record should make the outcome understandable later. It should include what changed, what was verified, what was not applicable, and whether deployment occurred.

## MCP tools for the loop

The `@clearance/mcp` server implements this loop: `claim_next` (steps 1–2), `claim_heartbeat` (step 6), `close_verified` (step 8, requires evidence), and `block_with_child` (step 8 alternative — creates the blocker child, blocks and demotes the parent, and releases the claim). `claim_next` only returns `autonomous_safe` items with no active claim and no human-blocker tags, so the stop conditions are enforced by eligibility, not convention.

## Current Status

Implemented in `@clearance/mcp`. See the [MCP tools reference](../reference/mcp-tools.md).
