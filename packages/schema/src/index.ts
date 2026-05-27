// @clearance/schema — the standalone Postgres PMO substrate for Clearance.
// The migration set lives in ../migrations; applyMigrations runs it against a
// fresh or existing database.
export { applyMigrations, listMigrationFiles, MIGRATIONS_DIR } from './migrate.js';
export type { ApplyMigrationsOptions, ApplyMigrationsResult } from './migrate.js';
