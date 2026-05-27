// @clearance/schema — the standalone Postgres PMO substrate for Clearance.
// The migration set lives in ../migrations; applyMigrations runs it against a
// fresh or existing database.
export { applyMigrations, migrationStatus, listMigrationFiles, MIGRATIONS_DIR } from './migrate.js';
export type { ApplyMigrationsOptions, ApplyMigrationsResult, MigrationStatus } from './migrate.js';
export * from './types.js';
