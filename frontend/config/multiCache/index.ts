import type { NuxtConfig } from '@nuxt/schema'
const IS_DEV = process.env.NODE_ENV === 'development'

const multiCache: NuxtConfig['multiCache'] = {
  component: {
    enabled: false,
  },
  data: {
    enabled: true,
  },
  route: {
    enabled: false,
  },
  api: {
    enabled: true,
    authorization: 'overriden-at-runtime',
    prefix: '/api/multi-cache',
    cacheTagInvalidationDelay: 5000,
  },
  cdn: {
    enabled: true,
    cacheControlHeader: 'CDN-Cache-Control',
    cacheTagHeader: 'Cache-Tag',
  },
  debug: IS_DEV,
}

export default multiCache
