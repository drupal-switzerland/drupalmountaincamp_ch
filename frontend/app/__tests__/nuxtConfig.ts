// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'

type RouteRule = {
  headers?: Record<string, string>
  cache?: { maxAge: number }
}

const ONE_YEAR = 31_536_000
const ONE_DAY = 86_400

type MultiCacheConfig = { route: { enabled: boolean } }

let routeRules: Record<string, RouteRule>
let multiCache: MultiCacheConfig

// nuxt.config.ts calls the defineNuxtConfig global, which only exists while
// Nuxt loads it.
beforeAll(async () => {
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
  const config = (await import('../../nuxt.config')).default as {
    routeRules: Record<string, RouteRule>
    multiCache: MultiCacheConfig
  }
  routeRules = config.routeRules
  multiCache = config.multiCache
  vi.unstubAllGlobals()
})

function cacheControl(route: string) {
  return routeRules[route]?.headers?.['cache-control'] ?? ''
}

function maxAge(route: string) {
  return Number(/(?:^|,)max-age=(\d+)/.exec(cacheControl(route))?.[1])
}

describe('route rules: cache-control per kind of static file', () => {
  it.each(['/_nuxt/**', '/_fonts/**'])(
    'lets content-hashed files under %s be cached for a year, immutable',
    (route) => {
      expect(cacheControl(route)).toContain('public')
      expect(cacheControl(route)).toContain('immutable')
      expect(maxAge(route)).toBe(ONE_YEAR)
    },
  )

  it('caches /fonts/** for a year', () => {
    expect(cacheControl('/fonts/**')).toContain('public')
    expect(maxAge('/fonts/**')).toBe(ONE_YEAR)
  })

  it('keeps /images/**, whose file names carry no hash, to a day and never immutable', () => {
    expect(cacheControl('/images/**')).toContain('public')
    expect(cacheControl('/images/**')).not.toContain('immutable')
    expect(maxAge('/images/**')).toBe(ONE_DAY)
    expect(cacheControl('/images/**')).toContain('stale-while-revalidate')
  })

  it('sets no cache rule on pages or on the API', () => {
    const routes = Object.keys(routeRules)

    expect(routes.sort()).toEqual(
      ['/_fonts/**', '/_nuxt/**', '/fonts/**', '/images/**'].sort(),
    )
  })
})

describe('multi cache config', () => {
  // buildRouteCacheKey can give two different URLs the same key, so serving
  // whole pages from the route cache is not safe.
  it('keeps the route cache off', () => {
    expect(multiCache.route.enabled).toBe(false)
  })
})
