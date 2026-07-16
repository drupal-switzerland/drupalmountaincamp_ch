import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    alias: {
      '~': path.resolve(__dirname, './'),
    },
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
