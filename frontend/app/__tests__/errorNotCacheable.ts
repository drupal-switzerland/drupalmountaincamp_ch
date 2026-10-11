// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  createApp,
  createError,
  createRouter,
  eventHandler,
  setResponseHeader,
  setResponseStatus,
  toWebHandler,
  type H3Event,
} from 'h3'
import { isCdnCacheableStatus } from '../../server/utils/errorCacheability'
import { useRealCdnHeaders } from './support/cdnHeaders'

const ONE_YEAR = 31_536_000

type Hooks = {
  error?: (error: Error, context: { event?: H3Event }) => void
  beforeResponse?: (event: H3Event, response: { body?: unknown }) => void
}

let request: (path: string) => Promise<Response>

// What a page render does before its status is known: every GraphQL response
// passes its cacheability on to the CDN header.
function cacheForAYear(event: H3Event) {
  useRealCdnHeaders((cdn) => cdn.public().setNumeric('maxAge', ONE_YEAR), event)
}

beforeAll(async () => {
  const hooks: Hooks = {}
  // h3 logs the thrown 500 of this suite as unhandled.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal(
    'defineNitroPlugin',
    (setup: (nitroApp: unknown) => void) => setup,
  )
  const setup = (await import('../../server/plugins/errorNotCacheable'))
    .default as unknown as (nitroApp: unknown) => void
  setup({
    hooks: {
      hook: <K extends keyof Hooks>(name: K, handler: Hooks[K]) => {
        hooks[name] = handler
      },
    },
  })

  // Wired as Nitro wires its h3 app: the error hook runs before the error
  // response is written, beforeResponse before any other response. Nuxt's
  // error handler then copies the headers of the rendered error page, whose
  // own GraphQL responses were cacheable, onto the response.
  const app = createApp({
    onError: (error, event) => {
      hooks.error?.(error, { event })
      setResponseHeader(
        event,
        'cdn-cache-control',
        `max-age=${ONE_YEAR}, public`,
      )
    },
    onBeforeResponse: (event, response) =>
      hooks.beforeResponse?.(event, response),
  })
  const router = createRouter()
  router.get(
    '/page',
    eventHandler((event) => {
      cacheForAYear(event)
      return 'page'
    }),
  )
  router.get(
    '/thrown-404',
    eventHandler((event) => {
      cacheForAYear(event)
      throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }),
  )
  router.get(
    '/thrown-500',
    eventHandler((event) => {
      cacheForAYear(event)
      throw new Error('render failed')
    }),
  )
  router.get(
    '/status-503',
    eventHandler((event) => {
      cacheForAYear(event)
      setResponseStatus(event, 503)
      return 'unavailable'
    }),
  )
  router.get(
    '/uncached',
    eventHandler(() => 'no cacheability'),
  )
  app.use(router)
  const handler = toWebHandler(app)
  request = (path) => handler(new Request(`http://localhost${path}`))
})

afterAll(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function directives(response: Response) {
  return (response.headers.get('cdn-cache-control') ?? '')
    .split(',')
    .map((directive) => directive.trim())
    .filter(Boolean)
}

describe('CDN cacheability of error responses', () => {
  it('leaves a 200 page as cacheable as its data made it', async () => {
    const response = await request('/page')

    expect(response.status).toBe(200)
    expect(directives(response).sort()).toEqual([
      `max-age=${ONE_YEAR}`,
      'public',
    ])
  })

  it('adds no header to a 200 response that had none', async () => {
    const response = await request('/uncached')

    expect(response.status).toBe(200)
    expect(response.headers.has('cdn-cache-control')).toBe(false)
  })

  it.each([
    ['/thrown-404', 404],
    ['/thrown-500', 500],
    ['/status-503', 503],
  ])('makes %s private for the CDN', async (path, status) => {
    const response = await request(path)

    expect(response.status).toBe(status)
    expect(directives(response)).toEqual(['private'])
  })
})

describe('isCdnCacheableStatus', () => {
  it.each([200, 204, 301, 302, 304, 399])('allows %s', (status) => {
    expect(isCdnCacheableStatus(status)).toBe(true)
  })

  it.each([
    400,
    404,
    410,
    500,
    503,
    0,
    -1,
    200.5,
    Number.NaN,
    undefined,
    '200',
  ])('refuses %s', (status) => {
    expect(isCdnCacheableStatus(status)).toBe(false)
  })
})
