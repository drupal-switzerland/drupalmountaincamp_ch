import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import type { H3Event } from 'h3'
import lruCacheDriver from 'unstorage/drivers/lru-cache'
import {
  buildRouteCacheKey,
  isCacheEnabledForRequest,
} from './utils/multiCache'

// The logic lives in utils/multiCache.ts: nuxt-multi-cache replaces this file
// with an empty stub in client builds, which is also what tests would import.
const multiCacheServerOptions = defineMultiCacheOptions({
  api: {},
  data: {},
  enabledForRequest: (event: H3Event) => {
    return Promise.resolve(isCacheEnabledForRequest(event))
  },
  route: {
    storage: {
      driver: lruCacheDriver({
        max: 10000,
      }),
    },
    buildCacheKey: (event: H3Event) => buildRouteCacheKey(event),
  },
})

export default multiCacheServerOptions
