# Schema Architecture

The Clearance schema is the durable PMO substrate.

It should store enough structured state that work can be inspected, claimed, blocked, reviewed, closed, and summarized without replaying chat logs.

## Planned Table Groups

The planned schema includes:

- work items and work item candidates
- governance tags and work item tag mappings
- claims and leases
- work item links and preconditions
- project tracks, project links, and project candidates
- run packs and run pack items
- work types, surfaces, and surface mappings
- decision threads

## Storage Choice

Postgres is the v1 target.

The model needs transactions, row-level coordination for claims, JSONB metadata, constraints, indexes, and eventual notification hooks. Abstracting storage before the model is stable would add complexity without making v1 more useful.

## Migration Expectations

The schema package should support:

- install from an empty database
- repeatable migration checks
- seed data for reserved tags and default vocabularies
- reversible or clearly documented migrations
- generated TypeScript types

## Current Status

No Clearance schema has been implemented yet. This page documents the intended architecture.
