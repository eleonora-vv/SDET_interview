import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 2,
  reporter: 'html',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node app/server.js',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    env: { ENABLE_TEST_ROUTES: 'true' },
  },
});
