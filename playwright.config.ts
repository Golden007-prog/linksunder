import { defineConfig } from '@playwright/test';
import { browserOptions } from './server/browser';
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4317', launchOptions: browserOptions() },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:4317',
    reuseExistingServer: false,
    timeout: 30000,
    env: { LINKSUNDER_DATA: '.e2e-data/' + Date.now() },
  },
});
