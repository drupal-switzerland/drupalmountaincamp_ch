import { resolve } from 'node:path'
import type { Nuxt, NuxtHooks } from '@nuxt/schema'
import {
  pathPrefix,
  acceptLanguage,
} from 'nuxt-language-negotiation/negotiators'
import blokkliDrupal from '@blokkli/editor/drupal'
import { runtimeConfig } from './config/runtimeConfig'
import graphqlMiddleware from './config/graphqlMiddleware'
import multiCache from './config/multiCache'
import { SITE_TITLE } from './app/helpers/site'

const ONE_YEAR = 31_536_000
const ONE_DAY = 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const NUXT_REQUEST_HOST = process.env.NUXT_REQUEST_HOST

const LANGCODES = [{ code: 'en', prefix: '' }]

// The files of the text painted above the fold, preloaded so it is not laid
// out in a fallback font first: ZT Gatha bold for headings, and the latin
// file of Source Sans 3 for body text. The heading font has a fixed path. The
// body font gets a content-hashed name from the build, so it is marked as a
// preload in the build manifest, which puts the link into every HTML
// response: pages, error pages and the shell for logged-in users. The dev
// server preloads the heading font only.
export const HEADING_FONT_PRELOAD = '/fonts/ZTGatha-Bold.woff2'
export const BODY_FONT_PRELOAD =
  /^source-sans-3-latin-wght-normal\.[\w-]+\.woff2$/

type BuildManifest = Parameters<NuxtHooks['build:manifest']>[0]

export function markBodyFontPreload(manifest: BuildManifest) {
  const entry = Object.values(manifest).find((chunk) => chunk.isEntry)
  const file = entry?.assets?.find((asset) => BODY_FONT_PRELOAD.test(asset))
  // No preload is a slower first paint on every page; better no build.
  if (!file) {
    throw new Error(
      'The latin file of Source Sans 3 is not among the entry assets, so it cannot be preloaded.',
    )
  }
  manifest[file] = {
    file,
    resourceType: 'font',
    mimeType: 'font/woff2',
    preload: true,
  }
}

// The dev server calls build:manifest too, with entries that list no assets.
export function bodyFontPreloadModule(_options: unknown, nuxt: Nuxt) {
  if (nuxt.options.dev) {
    return
  }
  nuxt.hook('build:manifest', markBodyFontPreload)
}

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
      title: SITE_TITLE,
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: HEADING_FONT_PRELOAD,
          crossorigin: 'anonymous',
        },
      ],
      meta: [
        { name: 'theme-color', content: '#184759' },
        {
          name: 'google-site-verification',
          content: 'SCUdRugj-xdUAPc-l5QvGazhSoLCk41JiDAOoztuT8I',
        },
        {
          name: 'msvalidate.01',
          content: '43CC5D0A5D1436DBF68D869408DF0A34',
        },
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
    '@nuxt/test-utils/module',
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
    bodyFontPreloadModule,
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },

  easyTexts: {
    pattern: [
      './app/components/**/*.{js,ts,vue}',
      './app/pages/**/*.{js,ts,vue}',
      './app/composables/**/*.{js,ts,vue}',
      './app/layouts/**/*.{js,ts,vue}',
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
    // Overridable per environment with NUXT_PUBLIC_ROKKA_HOST; an empty value
    // renders every image from the Drupal derivatives.
    host: 'mountaincamp.rokka.io',
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

  sourcemap: true,

  nitro: {
    compressPublicAssets: true,
  },

  hooks: {
    'vite:extend'({ config }) {
      if (config.server?.hmr && typeof config.server.ws === 'object') {
        config.server.ws.protocol = 'wss'
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

  languageNegotiation: {
    languages: LANGCODES,

    // We use two negotiators: Path prefix takes precedence. In cases where no
    // path prefix is available, we fall back to Accept-Language headers.
    negotiators: [pathPrefix(), acceptLanguage()],
  },

  svgIconSprite: {
    // Every symbol is decorative; controls get their name from text.
    ariaHidden: true,
    sprites: {
      default: {
        importPatterns: ['./app/assets/symbols/**/*.svg'],
      },
    },
  },

  postcss: {
    plugins: {
      'postcss-import': {},
      // Nuxt imports PostCSS plugins as ES modules, which cannot resolve the
      // directory 'tailwindcss/nesting'. The file is named instead, and the
      // entry @nuxtjs/tailwindcss adds under the directory name is switched off.
      'tailwindcss/nesting': false,
      'tailwindcss/nesting/index.js': {},
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
    // Build assets have content-hashed file names. Nuxt's own, more specific
    // /_nuxt/builds/** rules keep the unhashed latest.json short-lived.
    '/_nuxt/**': {
      cache: {
        maxAge: ONE_YEAR,
      },
      headers: {
        'cache-control': `public,max-age=${ONE_YEAR},s-maxage=${ONE_YEAR},immutable`,
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
