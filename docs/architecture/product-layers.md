# Product Layers

Clearance is planned as four layers.

## `@clearance/schema`

The schema package owns the database model, migrations, seed data, and generated types.

It should be installable into a fresh Postgres database without needing any other Clearance package.

## `@clearance/mcp`

The MCP package owns the tool interface.

It should connect to a Clearance database and expose bounded, documented tools for work intake, claims, blocking, closing, project tracking, run packs, and digests.

## `@clearance/contracts`

The contracts package owns role definitions and reusable prompts.

It should explain how ProjectManager, ProjectWorker, and ProjectInvestigator operate against Clearance without hard-coding one agent runtime.

## Optional Review Bot

The review bot package owns human review delivery.

It should post candidates, decisions, and digests into a configured review channel. Discord can be the first adapter, but the review layer should remain optional.

## Current Status

These are planned public surfaces. The repository currently contains documentation only.
