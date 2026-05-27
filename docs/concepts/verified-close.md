# Verified Close

Verified close means a work item cannot be marked done without evidence.

This is one of Clearance's core protections. A PMO system is only useful if closed work can be trusted later.

## Evidence Categories

A close should include evidence or an explicit not-applicable note for:

- tests, build, or lint when code changed
- smoke checks when runtime behavior changed
- deploy verification when a deploy occurred
- docs or changelog updates when behavior changed
- migration verification when schema changed
- no-code proof when no files changed

## Why Not Applicable Matters

Sometimes a category truly does not apply. Clearance should allow that, but it should be explicit.

For example, a docs-only change can mark deploy verification as not applicable. A migration change cannot silently skip migration verification.

## Close Quality

Good close evidence:

> `npm test` passed. Local smoke at `GET /health` returned 200. Updated `docs/guides/first-setup.md`. No deploy performed.

Poor close evidence:

> Done.

## Current Status

Verified close is planned as a core MCP tool behavior and a reference contract. The exact validation fields will be finalized during MCP implementation.
