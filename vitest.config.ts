import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const workspaceSource = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@pr0gbarz/contracts': workspaceSource(
        './packages/contracts/src/index.ts',
      ),
      '@pr0gbarz/database': workspaceSource('./packages/database/src/index.ts'),
      '@pr0gbarz/ui': workspaceSource('./packages/ui/src/index.tsx'),
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    include: [
      'apps/**/*.test.ts',
      'apps/**/*.test.tsx',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
    ],
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
