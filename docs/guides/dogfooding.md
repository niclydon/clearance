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

## Current Status

Dogfooding is planned after schema, MCP, and role contracts are usable.
