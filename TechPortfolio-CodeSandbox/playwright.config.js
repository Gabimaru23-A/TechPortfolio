import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    serviceWorkers: 'block',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4175 --strictPort',
    url: baseURL,
    env: {
      VITE_SUPABASE_URL: 'https://supabase.example.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e',
      VITE_LINKEDIN_URL: ''
    }
  }
});
