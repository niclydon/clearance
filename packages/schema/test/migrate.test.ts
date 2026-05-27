import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { applyMigrations, listMigrationFiles } from '../src/migrate.js';

const { Pool } = pg;

// Integration test against a real Postgres. Set CLEARANCE_TEST_DATABASE_URL (or
// DATABASE_URL) to a THROWAWAY database whose name contains "test"; the suite
// resets its public schema. Without the env var the suite is skipped, so
// `npm test` stays green on machines without Postgres.
const url = process.env.CLEARANCE_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

const EXPECTED_TABLES = [
  'work_items',
  'work_item_candidates',
  'work_item_tags',
  'work_item_surfaces',
  'work_item_links',
  'preconditions',
  'claims',
  'governance_tags',
  'work_types',
  'surfaces',
  'link_relationships',
  'project_tracks',
  'project_candidates',
  'project_track_links',
  'run_packs',
  'run_pack_items',
  'decision_threads',
  'clearance_migrations',
];

suite('clearance schema migrations', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url });
    const { rows } = await pool.query<{ db: string }>('SELECT current_database() AS db');
    const db = rows[0]?.db ?? '';
    if (!/test/.test(db)) {
      throw new Error(
        `Refusing to reset database "${db}": its name must contain "test". ` +
          'Point CLEARANCE_TEST_DATABASE_URL at a throwaway database.',
      );
    }
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('applies every migration from an empty database', async () => {
    const result = await applyMigrations({ pool });
    expect(result.applied).toEqual(listMigrationFiles());
    expect(result.applied.length).toBeGreaterThanOrEqual(7);

    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const names = tables.rows.map((row) => row.table_name);
    for (const expected of EXPECTED_TABLES) {
      expect(names).toContain(expected);
    }
  });

  it('seeds the reserved vocabularies', async () => {
    const count = async (table: string): Promise<number> => {
      const { rows } = await pool.query<{ c: number }>(`SELECT count(*)::int AS c FROM ${table}`);
      return rows[0]?.c ?? 0;
    };
    expect(await count('governance_tags')).toBe(8);
    expect(await count('work_types')).toBe(14);
    expect(await count('surfaces')).toBe(8);
    expect(await count('link_relationships')).toBe(11);
  });

  it('is idempotent on a second run', async () => {
    const result = await applyMigrations({ pool });
    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual(listMigrationFiles());
  });

  it('enforces the blocked-is-not-autonomous_safe invariant', async () => {
    await expect(
      pool.query(
        `INSERT INTO work_items (title, status, tags) VALUES ('x', 'blocked', ARRAY['autonomous_safe'])`,
      ),
    ).rejects.toThrow();
  });

  it('enforces the governance-tag foreign key on work_item_tags', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO work_items (title) VALUES ('y') RETURNING id`,
    );
    const id = rows[0]!.id;
    await expect(
      pool.query(`INSERT INTO work_item_tags (work_item_id, tag) VALUES ($1, 'not_a_real_tag')`, [
        id,
      ]),
    ).rejects.toThrow();
  });
});
