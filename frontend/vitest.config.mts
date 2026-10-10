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
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.*',
        'components/**/*.*',
        'composables/**/*.*',
        'config/**/*.*',
        'layouts/**/*.*',
        'middleware/**/*.*',
        'plugins/**/*.*',
        '/**/*.*',
      ],
    },
  },
})
