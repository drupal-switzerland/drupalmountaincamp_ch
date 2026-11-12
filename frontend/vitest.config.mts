import { defineVitestConfig } from '@nuxt/test-utils/config'

// Each test file starts its own Nuxt app in a beforeAll hook. Measured on 32
// cores: 2.2s at load 15, 4.5s at load 40, 7.9s at load 50, and past vitest's
// 10s default from load 55, which fails the whole file with its tests skipped.
const HOOK_TIMEOUT_MS = 60_000

// About three points under the measured 84.5 / 73.5 / 81.7 / 84.5, so an
// unrelated change does not fail the run. Raise them when coverage rises.
const COVERAGE_THRESHOLDS = {
  lines: 81,
  branches: 70,
  functions: 78,
  statements: 81,
}

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
      thresholds: COVERAGE_THRESHOLDS,
    },
  },
})
