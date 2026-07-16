import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { getHeaders, type H3Event } from 'h3'
import lruCacheDriver from 'unstorage/drivers/lru-cache'

const multiCacheServerOptions = defineMultiCacheOptions({
  api: {},
  data: {},
  enabledForRequest: (event: H3Event) => {
    const hasSession = (event.node.req.headers.cookie || '').includes('SSESS')
    return Promise.resolve(!hasSession)
  },
  route: {
    storage: {
      driver: lruCacheDriver({
        max: 10000,
      }),
    },
    buildCacheKey: (event: H3Event) => {
      const path = (event.path || '')
        .replaceAll('/', '__')
        .replaceAll('?', '__')
        .replaceAll('&', '__')

      const headers = getHeaders(event)
      const cookie = headers.cookie || 'anonymous'
      return path + cookie
    },
  },
})

export default multiCacheServerOptions
