# Claims and Leases

Claims prevent two workers from doing the same work at the same time.

Before a worker edits files, runs a deploy, or starts meaningful execution, it should claim the work item. The claim records who is working, when the claim started, when it expires, and what execution context is being used.

## Claim Metadata

A claim should record:

- worker identity
- session or run reference
- work item id
- repo path when relevant
- branch or worktree when relevant
- heartbeat timestamp
- lease expiry
- outcome and evidence when released

## Leases

Claims are leases, not permanent locks.

If a worker disappears, the lease expires and another worker can reclaim the item. Heartbeats extend active leases while work is still moving.

## Why This Matters

Without claims, two agents can edit the same files, choose the same migration number, deploy over each other, or both close the same item with conflicting evidence.

Claims make coordination visible.

## Current Status

Claim tools are planned for the core MCP server: claim next, heartbeat, release through close, and release through block.
