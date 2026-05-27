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

## Current Status

This guide defines intended behavior. Exact command and tool examples will be added after MCP tools are implemented.
