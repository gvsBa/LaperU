import { defineConfig } from 'vitest/config'

/** Refuse any database except an explicitly opted-in, local QA database. */
export function assertIntegrationDatabaseSafety() {
  if (process.env.LAPERU_INTEGRATION_TESTS !== '1') {
    throw new Error('Integration tests require LAPERU_INTEGRATION_TESTS=1.')
  }
  let databaseUrl: URL
  try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? '')
  } catch {
    throw new Error('Integration tests require an explicit local QA DATABASE_URL.')
  }
  if (
    databaseUrl.protocol !== 'mysql:'
    || !['localhost', '127.0.0.1'].includes(databaseUrl.hostname)
    || !/^\/laperu_test_[a-zA-Z0-9_]+$/.test(databaseUrl.pathname)
  ) {
    throw new Error('Refusing integration tests: database must be local and named laperu_test_<suffix>.')
  }
  process.env.NODE_ENV = 'test'
}

// Evaluate before Vitest can collect a test or import the application.
// Do not load dotenv here; opting in must be explicit in the calling process.
assertIntegrationDatabaseSafety()

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
