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
    },
  },
  test: {
    coverage: {
      reporter: ['text', 'html'],
    },
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
  },
})
