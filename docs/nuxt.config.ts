export default defineNuxtConfig({
  // https://github.com/nuxt-themes/docus
  extends: ['@nuxt-themes/docus'],

  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    'nuxt-svg-icon-sprite',
    '@nuxt/fonts',
    '@nuxt/icon',
  ],
  content: {
    highlight: {
      langs: [
        'json',
        'js',
        'ts',
        'html',
        'css',
        'vue',
        'shell',
        'mdc',
        'md',
        'yaml',
        'php',
        'graphql',
        'twig',
      ],
    },
  },

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./assets/icons/**/*.svg'],
      },
    },
  },

  icon: {
    //serverBundle: 'remote',
    customCollections: [
      {
        prefix: 'starterkit',
        dir: './assets/icons',
      },
    ],
  },

  postcss: {
    plugins: {
      'postcss-nested': {},
    },
  },

  compatibilityDate: '2024-09-05',
})
