#!/usr/bin/env node
import { applyMigrations, migrationStatus } from './migrate.js';

const USAGE = `clearance — Postgres PMO schema migrations

Usage:
  clearance migrate   Apply all pending migrations
  clearance status    Show applied and pending migrations

Environment:
  DATABASE_URL   Postgres connection string (required)
`;

async function main(): Promise<void> {
  const command = process.argv[2];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(USAGE);
    return;
  }

  if (command !== 'migrate' && command !== 'status') {
    process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    process.stderr.write(
      'Error: DATABASE_URL is not set. Point it at your Clearance Postgres database, e.g.\n' +
        '  export DATABASE_URL=postgres://localhost/clearance\n',
    );
    process.exitCode = 1;
    return;
  }

  if (command === 'status') {
    const status = await migrationStatus({ connectionString });
    process.stdout.write(`Applied (${status.applied.length}):\n`);
    for (const file of status.applied) {
      process.stdout.write(`  ✓ ${file}\n`);
    }
    process.stdout.write(`Pending (${status.pending.length}):\n`);
    for (const file of status.pending) {
      process.stdout.write(`  • ${file}\n`);
    }
    return;
  }

  const result = await applyMigrations({
    connectionString,
    log: (message) => process.stdout.write(`${message}\n`),
  });
  if (result.applied.length === 0) {
    process.stdout.write(`Up to date. ${result.skipped.length} migration(s) already applied.\n`);
  } else {
    process.stdout.write(`Applied ${result.applied.length} migration(s):\n`);
    for (const file of result.applied) {
      process.stdout.write(`  ✓ ${file}\n`);
    }
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Migration failed: ${(error as Error).message}\n`);
  process.exitCode = 1;
});
