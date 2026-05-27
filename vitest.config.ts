import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Integration tests reset and migrate a real Postgres database; allow time
    // for the schema reset to wait out a transient lock instead of timing out
    // mid-transaction (which would leave the test database in a partial state).
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
