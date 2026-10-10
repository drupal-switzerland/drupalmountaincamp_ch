import { defineVitestConfig } from '@nuxt/test-utils/config'

// Each test file starts its own Nuxt app in a beforeAll hook. Measured on 32
// cores: 2.2s at load 15, 4.5s at load 40, 7.9s at load 50, and past vitest's
// 10s default from load 55, which fails the whole file with its tests skipped.
const HOOK_TIMEOUT_MS = 60_000

export default defineVitestConfig({
  test: {
    hookTimeout: HOOK_TIMEOUT_MS,
    globals: true,
    environment: 'nuxt',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/*.*'],
    coverage: {
      all: true,
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts', 'config/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.d.ts'],
    },
  },
})
