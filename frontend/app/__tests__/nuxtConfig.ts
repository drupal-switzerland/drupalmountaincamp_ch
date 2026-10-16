// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { beforeAll, describe, expect, it, vi } from 'vitest'

type RouteRule = {
  headers?: Record<string, string>
  cache?: { maxAge: number }
}

const ONE_YEAR = 31_536_000
const ONE_DAY = 86_400
// The plugin import test starts a Node process: 0.5s to 1.5s as a rule, 11.5s
// once on the first run after an install, past vitest's 5s default.
const PLUGIN_IMPORT_TIMEOUT_MS = 60_000

type MultiCacheConfig = {
  route: { enabled: boolean }
  api: { enabled: boolean; authorization?: unknown }
}

let routeRules: Record<string, RouteRule>
let multiCache: MultiCacheConfig
let postcssPlugins: Record<string, unknown>

// nuxt.config.ts calls the defineNuxtConfig global, which only exists while
// Nuxt loads it.
beforeAll(async () => {
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
  const config = (await import('../../nuxt.config')).default as {
    routeRules: Record<string, RouteRule>
    multiCache: MultiCacheConfig
    postcss: { plugins: Record<string, unknown> }
  }
  routeRules = config.routeRules
  multiCache = config.multiCache
  postcssPlugins = config.postcss.plugins
  vi.unstubAllGlobals()
})

function cacheControl(route: string) {
  return routeRules[route]?.headers?.['cache-control'] ?? ''
}

function maxAge(route: string) {
  return Number(/(?:^|,)max-age=(\d+)/.exec(cacheControl(route))?.[1])
}

describe('route rules: cache-control per kind of static file', () => {
  it('lets content-hashed files under /_nuxt/** be cached for a year, immutable', () => {
    expect(cacheControl('/_nuxt/**')).toContain('public')
    expect(cacheControl('/_nuxt/**')).toContain('immutable')
    expect(maxAge('/_nuxt/**')).toBe(ONE_YEAR)
  })

  it('keeps /images/**, whose file names carry no hash, to a day and never immutable', () => {
    expect(cacheControl('/images/**')).toContain('public')
    expect(cacheControl('/images/**')).not.toContain('immutable')
    expect(maxAge('/images/**')).toBe(ONE_DAY)
    expect(cacheControl('/images/**')).toContain('stale-while-revalidate')
  })

  it('sets no cache rule on pages or on the API', () => {
    const routes = Object.keys(routeRules)

    expect(routes.sort()).toEqual(['/_nuxt/**', '/images/**'].sort())
  })
})

describe('multi cache config', () => {
  // buildRouteCacheKey can give two different URLs the same key, so serving
  // whole pages from the route cache is not safe.
  it('keeps the route cache off', () => {
    expect(multiCache.route.enabled).toBe(false)
  })

  // A token in the config would be part of every build and of this
  // repository. The cache API takes it from the environment at runtime.
  it('has no cache API token in the build', () => {
    expect(multiCache.api.enabled).toBe(true)
    expect(multiCache.api.authorization).toBe('')
  })
})

describe('PostCSS plugins', () => {
  // Nuxt loads each plugin with an ES module import. Node resolves those more
  // strictly than require(): a directory such as 'tailwindcss/nesting' fails,
  // and the build then runs without the plugin. Asked of Node itself, because
  // the test runner's own resolver accepts directories.
  it(
    'are all importable as ES modules',
    () => {
      const enabled = Object.keys(postcssPlugins).filter(
        (name) => postcssPlugins[name],
      )
      expect(enabled).toContain('tailwindcss')

      const script = `for (const name of ${JSON.stringify(enabled)}) await import(name)`
      expect(() =>
        execFileSync(process.execPath, ['--input-type=module', '-e', script], {
          stdio: 'pipe',
          // A hung child would block this worker past vitest's own timer.
          timeout: PLUGIN_IMPORT_TIMEOUT_MS,
        }),
      ).not.toThrow()
    },
    PLUGIN_IMPORT_TIMEOUT_MS,
  )

  it('flatten nested rules before Tailwind runs', () => {
    const enabled = Object.keys(postcssPlugins).filter(
      (name) => postcssPlugins[name],
    )
    const nesting = enabled.findIndex((name) =>
      name.startsWith('tailwindcss/nesting'),
    )

    expect(nesting).toBeGreaterThan(-1)
    expect(nesting).toBeLessThan(enabled.indexOf('tailwindcss'))
  })
})
