import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  expect: {
    toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.01 },
  },
  fullyParallel: true,
  outputDir: '../../test-results',
  reporter: 'list',
  testDir: './visual-tests',
  use: { baseURL: 'http://127.0.0.1:4173', colorScheme: 'light' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4173',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 900, width: 1440 },
      },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'], viewport: { height: 844, width: 320 } },
    },
    {
      name: 'firefox',
      testMatch: /critical-flow\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /critical-flow\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
