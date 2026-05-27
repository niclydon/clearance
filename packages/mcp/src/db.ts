import pg from 'pg';

const { Pool } = pg;

let shared: pg.Pool | undefined;

/** Lazily create (and reuse) a shared pool from a connection string or DATABASE_URL. */
export function getPool(connectionString: string | undefined = process.env.DATABASE_URL): pg.Pool {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Point it at your Clearance Postgres database, e.g. ' +
        'postgres://localhost/clearance',
    );
  }
  shared ??= new Pool({ connectionString });
  return shared;
}

/** Close the shared pool, if one was created. */
export async function closePool(): Promise<void> {
  if (shared) {
    await shared.end();
    shared = undefined;
  }
}
