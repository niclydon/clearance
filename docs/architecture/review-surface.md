# Review Surface

The review surface is optional.

It exists to make human review easier by posting candidates, decisions, and digests into a channel where the operator already works.

## Planned Capabilities

A review adapter should support:

- candidate review cards
- approve and reject actions
- decision request threads
- digest summaries
- links back to work items and project tracks

## Adapter Boundary

The PMO core should not depend on Discord, Slack, Teams, email, or any specific review channel.

Review adapters should translate PMO events into human-facing review experiences. The schema and MCP server remain usable without them.

## First Adapter

Discord is a practical first adapter because the source PMO workflow used Discord review loops. That history should guide implementation, but not lock Clearance to Discord.

## Current Status

The review surface is planned after schema, MCP, and contracts.
