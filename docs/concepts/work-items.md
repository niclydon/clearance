# Work Items

Work items are the executable units of Clearance.

A work item should be specific enough that a worker can claim it, understand the expected outcome, do the work, and close or block it with evidence.

## What A Work Item Needs

A useful work item includes:

- title
- body or instructions
- status
- priority
- source and provenance
- category or work type
- tags
- optional project track links
- metadata for environment-specific context
- operator notes when a human has clarified intent

## Lifecycle

Clearance separates lifecycle status from execution permission.

Status might say an item is open, in progress, blocked, closed, or deferred. Tags say whether a worker may act, whether a human decision is needed, or whether the item is waiting on a dependency.

This separation prevents a common failure: treating every open item as executable.

## Good Work Item Shape

Good:

> Add a smoke check that verifies the backup digest endpoint returns current data, then close with test output and docs update.

Too broad:

> Fix backups.

Too vague:

> Look at the weird thing from yesterday.

## Current Status

Work item tables and MCP tools are planned. The founding docs define the contract before implementation begins.
