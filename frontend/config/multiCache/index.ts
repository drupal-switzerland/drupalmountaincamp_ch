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
    // No token in the build: NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN sets it at
    // runtime, and without one the API refuses every request.
    authorization: '',
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
