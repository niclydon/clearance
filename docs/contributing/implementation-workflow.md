# Implementation Workflow

Implementation should proceed in small, documented tranches.

## Expected Sequence

1. Keep the founding docs current.
2. Build the schema package.
3. Add seed data and migration tests.
4. Build MCP read tools.
5. Build MCP write tools with strict validation.
6. Add role contracts.
7. Dogfood on a non-Nexus project.
8. Add optional review surfaces.
9. Prepare public launch materials.

## Done Means Documented

A behavior is not done until the docs explain how to use it.

For each implementation change, include:

- tests or smoke evidence
- docs updates
- reference updates for public contracts
- examples when the behavior is user-facing

## Public Boundary

Do not import private Nexus assumptions into the public packages. If a behavior depends on a host system, document it as an integration point.

## Current Status

No implementation packages exist yet. This workflow defines the expected path once coding begins.
