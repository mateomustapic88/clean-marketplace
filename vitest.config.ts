import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  cacheDir: '.cache/vitest',
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
})
