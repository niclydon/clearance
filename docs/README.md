# Clearance Documentation

This documentation is the product foundation for Clearance. It explains the PMO/work-management model first, then shows how the planned schema, MCP tools, role contracts, and optional review surfaces make that model operational.

## Current Status

The repository is pre-implementation. Documentation pages describe the intended public system unless a page explicitly says otherwise. As packages land, each page should be updated from "planned" to "implemented" with exact commands, examples, and compatibility notes.

## Reader Paths

For a first-time reader:

1. Read the [founding plan](founding-plan.md).
2. Read [concepts](concepts/README.md) for the operating model.
3. Read [guides/first-setup.md](guides/first-setup.md) to understand the expected adoption path.

For someone operating a system:

1. Read [project tracks](concepts/project-tracks.md), [work items](concepts/work-items.md), and [candidates](concepts/candidates.md).
2. Read [digest and review workflow](guides/digest-review-workflow.md).
3. Read [verified close](concepts/verified-close.md) before trusting closed work.

For someone building Clearance:

1. Read [architecture](architecture/README.md).
2. Read [schema architecture](architecture/schema.md) and [MCP surface](architecture/mcp-surface.md).
3. Read [implementation workflow](contributing/implementation-workflow.md).

For future agents:

1. Read [role boundaries](concepts/role-boundaries.md).
2. Read [worker execution](guides/worker-execution.md).
3. Read [documentation standards](contributing/documentation-standards.md).

## Documentation Map

- [Founding plan](founding-plan.md): product identity, extraction boundary, v1 phases, and open decisions.
- [Concepts](concepts/README.md): durable concepts in the PMO model.
- [Architecture](architecture/README.md): planned product layers and integration boundaries.
- [Guides](guides/README.md): operating workflows for setup, review, execution, and dogfooding.
- [Reference](reference/README.md): controlled vocabularies, table groups, MCP tools, role contracts, evidence requirements, and source material.
- [Contributing](contributing/README.md): standards for docs and implementation work.

## Documentation Rule

Clearance is public infrastructure. Behavior that is not documented is not finished. Every implementation change should update the conceptual docs, the relevant guide, and the reference page that someone would use to operate it.
