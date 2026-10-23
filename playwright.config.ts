import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testIgnore: process.env.BASE_URL ? [] : ['**/live.spec.ts'],
  fullyParallel: false,
  workers: 2,
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8788',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'light', use: { browserName: 'chromium', colorScheme: 'light' } },
    { name: 'dark', use: { browserName: 'chromium', colorScheme: 'dark' } },
  ],
  webServer: process.env.BASE_URL
    ? []
    : {
        command: 'npm run preview',
        url: 'http://localhost:8788',
        reuseExistingServer: !process.env.CI,
        env: { WRANGLER_SEND_METRICS: 'false' },
      },
});
