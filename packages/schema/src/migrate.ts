import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

/** Directory holding the numbered .sql migration files. */
export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const MIGRATION_FILE = /^\d{4}_.*\.sql$/;

export interface ApplyMigrationsOptions {
  /** Postgres connection string. Falls back to DATABASE_URL. Ignored when `pool` is supplied. */
  connectionString?: string;
  /** An existing pg Pool to use instead of creating (and closing) one. */
  pool?: pg.Pool;
  /** Directory of numbered .sql files. Defaults to the package migrations dir. */
  migrationsDir?: string;
  /** Optional progress logger. */
  log?: (message: string) => void;
}

export interface ApplyMigrationsResult {
  applied: string[];
  skipped: string[];
}

/** The migration file names, sorted in apply order. */
export function listMigrationFiles(dir: string = MIGRATIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((name) => MIGRATION_FILE.test(name))
    .sort();
}

/**
 * Apply every pending migration in order. Each file runs in its own transaction
 * and is recorded in `clearance_migrations`; already-applied files are skipped,
 * so this is safe to run repeatedly.
 */
export async function applyMigrations(
  options: ApplyMigrationsOptions = {},
): Promise<ApplyMigrationsResult> {
  const dir = options.migrationsDir ?? MIGRATIONS_DIR;
  const log = options.log ?? (() => {});
  const ownsPool = !options.pool;
  const pool =
    options.pool ??
    new Pool({ connectionString: options.connectionString ?? process.env.DATABASE_URL });

  const result: ApplyMigrationsResult = { applied: [], skipped: [] };
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS clearance_migrations (
         version    text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const existing = await client.query<{ version: string }>(
      'SELECT version FROM clearance_migrations',
    );
    const done = new Set(existing.rows.map((row) => row.version));

    for (const file of listMigrationFiles(dir)) {
      if (done.has(file)) {
        result.skipped.push(file);
        continue;
      }
      const sql = readFileSync(join(dir, file), 'utf8');
      log(`applying ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO clearance_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        result.applied.push(file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`, { cause: error });
      }
    }
  } finally {
    client.release();
    if (ownsPool) {
      await pool.end();
    }
  }
  return result;
}

export interface MigrationStatus {
  applied: string[];
  pending: string[];
}

/** Report which migrations are applied vs pending without changing anything. */
export async function migrationStatus(
  options: ApplyMigrationsOptions = {},
): Promise<MigrationStatus> {
  const dir = options.migrationsDir ?? MIGRATIONS_DIR;
  const all = listMigrationFiles(dir);
  const ownsPool = !options.pool;
  const pool =
    options.pool ??
    new Pool({ connectionString: options.connectionString ?? process.env.DATABASE_URL });
  try {
    const registry = await pool.query<{ present: boolean }>(
      "SELECT to_regclass('clearance_migrations') IS NOT NULL AS present",
    );
    if (!registry.rows[0]?.present) {
      return { applied: [], pending: all };
    }
    const { rows } = await pool.query<{ version: string }>(
      'SELECT version FROM clearance_migrations',
    );
    const done = new Set(rows.map((row) => row.version));
    return {
      applied: all.filter((file) => done.has(file)),
      pending: all.filter((file) => !done.has(file)),
    };
  } finally {
    if (ownsPool) {
      await pool.end();
    }
  }
}
