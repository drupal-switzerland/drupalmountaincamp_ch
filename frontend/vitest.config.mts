import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
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
