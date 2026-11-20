import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/catlog/`,
    // A narrow phone screen. Most owners use the app like this.
    ...devices['Pixel 7'],
    viewport: { width: 360, height: 740 },
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  // Test the real production build, because the service worker and the CSP exist only there.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/catlog/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
