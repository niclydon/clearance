# Architecture

Clearance is planned as a small set of composable layers.

The schema is the source of truth. The MCP server exposes the schema to tools and agents. Role contracts explain how actors use those tools. Optional review surfaces make human approval and decision workflows easier.

## Planned Layers

- [Product layers](product-layers.md): the package-level shape.
- [Schema](schema.md): the Postgres PMO substrate.
- [MCP surface](mcp-surface.md): the tool interface for workers, managers, and humans.
- [Role contracts](role-contracts.md): reusable operating contracts.
- [Review surface](review-surface.md): optional chat or UI review adapters.
- [Integration boundaries](integration-boundaries.md): what Clearance does and does not own.
- [Decision records](decision-records.md): settled founding decisions and the reasoning behind them.

## Architectural Principle

Clearance should be useful without a particular chat platform, LLM provider, deployment stack, or host application.

Integrations should attach to the PMO core rather than becoming prerequisites for it.
