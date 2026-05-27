# @clearance/schema

The standalone Postgres PMO substrate for Clearance: the migration set, reserved-vocabulary seed, and a migration runner. No Nexus dependencies.

## What it contains

- **Migrations** (`migrations/*.sql`, numbered, applied in order):
  - `0001_vocabularies` — `governance_tags`, `work_types`, `surfaces`, `link_relationships`
  - `0002_work_items` — `work_items` (with the governance CHECK invariants)
  - `0003_work_item_satellites` — `work_item_candidates`, `work_item_tags`, `work_item_surfaces`, `work_item_links`, `preconditions`, `claims`
  - `0004_projects` — `project_tracks`, `project_candidates`, `project_track_links`
  - `0005_run_packs` — `run_packs`, `run_pack_items`
  - `0006_decision_threads` — `decision_threads`
  - `0007_seed` — the reserved governance tags (8), work types (14), surfaces (8), and link relationships (11)
- **`applyMigrations`** — a runner that applies pending migrations in order, each in its own transaction, tracked in `clearance_migrations` so re-runs are no-ops.

## Usage

```ts
import { applyMigrations } from '@clearance/schema';

await applyMigrations({ connectionString: process.env.DATABASE_URL });
```

A user-facing `npx clearance migrate` CLI and generated TypeScript table types are added in the schema-CLI work (see the [founding plan](../../docs/founding-plan.md) Phase 1).

## Requirements

- PostgreSQL 14+ (uses `gen_random_uuid()` and `GENERATED ... AS IDENTITY`).

## Testing

The integration test (`test/migrate.test.ts`) runs only when `CLEARANCE_TEST_DATABASE_URL` (or `DATABASE_URL`) points at a throwaway database whose name contains `test`; it resets that database's `public` schema. Without the env var it is skipped, so the repo's baseline `npm test` stays green without a database.
