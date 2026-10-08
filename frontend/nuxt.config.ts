import { resolve } from 'node:path'
import {
  pathPrefix,
  acceptLanguage,
} from 'nuxt-language-negotiation/negotiators'
import blokkliDrupal from '@blokkli/editor/drupal'
import { runtimeConfig } from './config/runtimeConfig'
import graphqlMiddleware from './config/graphqlMiddleware'
import multiCache from './config/multiCache'

const ONE_YEAR = 31_536_000
const ONE_DAY = 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const NUXT_REQUEST_HOST = process.env.NUXT_REQUEST_HOST

const LANGCODES = [{ code: 'en', prefix: '' }]

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  telemetry: false,
  graphqlMiddleware,
  multiCache,
  runtimeConfig,

  alias: {
    '#nuxt-svg-sprite': resolve(import.meta.dirname, './.nuxt/nuxt-svg-sprite'),
    'tailwind-config': resolve(import.meta.dirname, './tailwind.config.ts'),
    '#vuepal/rokka': resolve(import.meta.dirname, './.nuxt/vuepal-rokka.ts'),
  },

  app: {
    rootId: 'nuxt-root',
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Mountain Camp 2027, Davos, Switzerland',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'theme-color', content: '#184759' },
        {
          name: 'description',
          content:
            'Mountain Camp 2027 is the Swiss Drupal community conference in Davos, Switzerland. Open Source on top of the world, March 02–04, 2027.',
        },
      ],
    },
  },

  /**
   * Nuxt.js modules
   */
  modules: [
    '@nuxt/fonts',
    '@nuxt/test-utils/module',
    '@formkit/nuxt',
    '@nuxtjs/tailwindcss',
    'nuxt-graphql-middleware',
    'nuxt-easy-texts',
    '@rokka-io/nuxt',
    'nuxt-page-dependencies',
    'nuxt-multi-cache',
    'vuepal',
    'nuxt-language-negotiation',
    'nuxt-svg-icon-sprite',
    '@blokkli/editor',
    '@nuxt/eslint',
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },

  easyTexts: {
    pattern: [
      './app/components/**/*.{js,ts,vue}',
      './app/pages/**/*.{js,ts,vue}',
      './app/composables/**/*.{js,ts,vue}',
      './app/*.{js,ts,vue}',
    ],
    generators: [
      {
        outputPath: './app/queries/translations.graphql',
        generate: 'drupal-graphql-texts',
      },
    ],
  },

  rokka: {
    host: '',
    viewports: {
      xs: 640,
      sm: 768,
      md: 1024,
      lg: 1280,
      xl: 1380,
    },
    dpr: ['', '1.5', '2'],
  },

  pageDependencies: {
    checkComposableCalled: true,
  },

  vuepal: {
    frontendRouting: {
      enabled: true,
      defaultLanguage: 'en',
      outputPath: './../drupal/config/default/frontend_routing.settings.yml',
    },
    adminToolbar: {
      enabled: true,
    },
    localTasks: {
      enabled: true,
    },
    drupalRoute: {
      enabled: true,
    },
    devMode: {
      enabled: true,
      url: `https://${NUXT_REQUEST_HOST}`,
      forceHttps: true,
    },
  },

  // Self-hosted at build time (served from /_fonts with long caching) instead
  // of a render-blocking Google Fonts stylesheet; only the weights in use.
  fonts: {
    defaults: {
      subsets: ['latin', 'latin-ext'],
    },
    families: [
      {
        name: 'Source Sans 3',
        provider: 'google',
        weights: [400, 600, 700],
        styles: ['normal', 'italic'],
      },
      {
        name: 'Zilla Slab',
        provider: 'google',
        weights: [600, 700],
        styles: ['normal'],
      },
    ],
  },

  sourcemap: true,

  nitro: {
    compressPublicAssets: true,
  },

  hooks: {
    'vite:extend'({ config }) {
      if (config.server && config.server.hmr) {
        // @ts-ignore
        config.server.hmr.protocol = 'wss'
      }
    },
  },

  vite: {
    css: {
      devSourcemap: true,
    },
    server: {
      allowedHosts: true,
    },

    plugins: [],
  },

  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },

  formkit: {
    autoImport: true,
  },

  languageNegotiation: {
    languages: LANGCODES,

    // We use two negotiators: Path prefix takes precedence. In cases where no
    // path prefix is available, we fall back to Accept-Language headers.
    negotiators: [pathPrefix(), acceptLanguage()],
  },

  svgIconSprite: {
    sprites: {
      default: {
        importPatterns: ['./app/assets/symbols/**/*.svg'],
      },
    },
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      tailwindcss: {},
      'postcss-hexrgba': {
        colorFunctionNotation: 'modern',
        transformToBareValue: true,
      },
      cssnano: {
        preset: 'default',
      },
    },
  },

  routeRules: {
    '/_nuxt/**': {
      cache: {
        maxAge: ONE_YEAR,
      },
      headers: {
        'cache-control': `public,max-age=${ONE_YEAR},s-maxage=${ONE_YEAR}`,
      },
    },
    '/fonts/**': {
      cache: {
        maxAge: ONE_YEAR,
      },
      headers: {
        'cache-control': `public,max-age=${ONE_YEAR},s-maxage=${ONE_YEAR}`,
      },
    },
    // Self-hosted fonts from @nuxt/fonts; file names contain a content hash.
    '/_fonts/**': {
      headers: {
        'cache-control': `public,max-age=${ONE_YEAR},s-maxage=${ONE_YEAR},immutable`,
      },
    },
    // public/images has no content hash in its file names: short browser cache,
    // then revalidate in the background.
    '/images/**': {
      headers: {
        'cache-control': `public,max-age=${ONE_DAY},stale-while-revalidate=${ONE_WEEK}`,
      },
    },
  },

  blokkli: {
    modules: [blokkliDrupal()],
    pattern: ['./components/Paragraph/**/*.{js,ts,vue}'],
    globalOptions: {
      teaserStyle: {
        type: 'radios',
        label: 'Display',
        default: 'grid',
        options: {
          grid: 'Grid',
          staggered_grid: 'Staggered Grid',
        },
      },
      mobileStyle: {
        type: 'radios',
        label: 'Mobile display',
        default: 'stack',
        options: {
          stack: 'Stack',
          slider: 'Slider',
        },
      },
      spacing: {
        type: 'radios',
        label: 'Spacing',
        default: 'none',
        displayAs: 'icons',
        options: {
          none: { label: 'no spacing', icon: 'bk_mdi_density_small' },
          small: {
            label: 'small spacing',
            icon: 'bk_mdi_density_medium',
          },
          large: {
            label: 'large spacing',
            icon: 'bk_mdi_density_large',
          },
        },
      },
      imageFormat: {
        type: 'radios',
        label: 'Image Format',
        default: 'full',
        displayAs: 'icons',
        options: {
          full: { label: 'extra large', icon: 'bk_mdi_fullscreen' },
          big: { label: 'large', icon: 'bk_mdi_photo_size_select_large' },
          text: { label: 'medium', icon: 'bk_mdi_crop_landscape' },
          small: { label: 'small', icon: 'bk_mdi_photo_size_select_small' },
        },
      },
    },
    translations: {
      en: {
        editIndicatorLabel: 'Edit paragraphs',
      },
    },
    chunkNames: ['global', 'rare'],
    itemEntityType: 'paragraph',
    storageDefaults: {
      blockFavorites: ['text'],
    },
    // Generated on every build: Drupal's paragraph form drops any option that
    // is missing from this file when a paragraph is saved there.
    schemaOptionsPath: resolve(
      import.meta.dirname,
      '../drupal/docroot/modules/custom/blokkli_starterkit/data/schema.json',
    ),
    defaultLanguage: 'en',
    // Make sure the editor is always rendered in the default language
    // instead of the current page language.
    forceDefaultLanguage: true,
  },

  experimental: {
    asyncContext: true,
  },

  compatibilityDate: '2025-03-14',
})
