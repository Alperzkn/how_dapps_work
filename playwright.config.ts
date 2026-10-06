import { defineConfig } from '@playwright/test';

// Runs against the production build. Headless Chromium renders WebGL in software.
export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4273',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4273 --strictPort',
    url: 'http://localhost:4273',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
