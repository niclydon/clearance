import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve the workspace package to source so tests need no build step.
      '@clearance/schema': fileURLToPath(
        new URL('./packages/schema/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    // Integration tests reset and migrate a real Postgres database; allow time
    // for the schema reset to wait out a transient lock instead of timing out
    // mid-transaction (which would leave the test database in a partial state).
    testTimeout: 30000,
    hookTimeout: 30000,
    // These suites share one test database and each resets it; run files
    // sequentially so they never reset each other's fixtures concurrently.
    fileParallelism: false,
  },
});
