# First Work Item

A work item is the smallest unit that a worker can execute and verify.

## Example

For the backup reliability project, a first work item might be:

> Add a daily backup digest that reports the latest successful backup, latest failed backup, and any hosts without a successful backup in the last 24 hours.

It could carry:

- priority: high
- work type: monitoring
- tag: `requires_investigation` until the current backup data source is verified
- project link: `homelab-backup-reliability`

After investigation, a human or authorized manager could promote it to `autonomous_safe` if the implementation path is clear and safe.

## Work Item Flow

1. Create or promote the work item.
2. Add tags that reflect current permission and routing.
3. Claim it before execution.
4. Work within scope.
5. Block with a child item if execution discovers a concrete blocker.
6. Close with evidence when complete.

## MCP tools

The flow maps to `create_work_item` (or promote a candidate), `update_work_item` (tags/status — note `autonomous_safe` requires `operator_grant`), `claim_next`, `block_with_child`, and `close_verified`. See the [MCP tools reference](../reference/mcp-tools.md).

## Current Status

Implemented in `@clearance/mcp`.
