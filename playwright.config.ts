import { defineConfig, devices } from '@playwright/test';

// End-to-end checks against the built demo, served by `vite preview` on a
// dedicated port.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4179',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4179 --strictPort',
    url: 'http://localhost:4179',
    // Never reuse: another local preview could be listening on the port.
    reuseExistingServer: false,
  },
});
