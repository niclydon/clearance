# Table Groups Reference

This page describes the planned schema groups, not finalized table DDL.

## Work Intake

- `work_items`: accepted work.
- `work_item_candidates`: proposed work awaiting review.

## Governance Tags

- `governance_tags`: reserved and custom tag definitions.
- `work_item_tags`: tag assignments with provenance.

## Claims

- `claims`: active and historical worker leases.

## Relationships and Preconditions

- `work_item_links`: blockers, parent-child links, related work, and splits.
- `preconditions`: machine-checkable conditions for re-arming blocked work.

## Projects

- `project_tracks`: durable workstreams.
- `project_track_links`: links from tracks to work, docs, repos, candidates, and evidence.
- `project_candidates`: proposed tracks awaiting review.

## Run Packs

- `run_packs`: scoped execution batches.
- `run_pack_items`: per-item disposition inside a run pack.

## Taxonomy

- `work_types`: classification vocabulary.
- `surfaces`: systems or surfaces where work appears.
- `work_item_surfaces`: work-to-surface mapping.
- `link_relationships`: vocabulary for `project_track_links.relationship`.

## Decisions

- `decision_threads`: human decision asks and resolutions.

## Current Status

Implemented in `@clearance/schema` (`packages/schema/migrations/0001`–`0007`). These are the actual table names. See the [extraction map](extraction-map.md) for per-column detail and [schema architecture](../architecture/schema.md) for the migration/runner shape.
