import { defineConfig, devices } from '@playwright/test';

/**
 * Optional e2e suite (Phase 7 stretch). Covers three critical paths against a
 * self-contained contract mock of the Leita API + the Angular dev server.
 *
 * Run: `npx playwright install chromium` once, then `npm run e2e`.
 * Both servers below are started automatically. To run against the *real*
 * backend instead, start it on :5193 and drop the mock-api webServer entry.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/support/mock-api.mjs',
      port: 5193,
      reuseExistingServer: !process.env['CI'],
      stdout: 'ignore',
    },
    {
      command: 'npm start',
      port: 4200,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
