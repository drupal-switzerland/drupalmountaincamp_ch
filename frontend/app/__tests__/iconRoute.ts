import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { EventHandler, H3Event } from 'h3'
import { extractCacheability } from '../../server/utils/cacheability'

const BACKEND_URL = 'http://drupal.test'
const QUERY_TIMEOUT_MS = 4321

const { dataCache, cdnCalls, fetchRaw } = vi.hoisted(() => ({
  dataCache: {
    value: undefined as unknown,
    keys: [] as string[],
    addToCache: vi.fn(),
  },
  cdnCalls: [] as string[],
  fetchRaw: vi.fn(),
}))

// The Nuxt test environment needs the real runtime config; the route only
// adds the two server-side values it reads.
mockNuxtImport(
  'useRuntimeConfig',
  (original: () => Record<string, unknown>) => () => ({
    ...original(),
    backendUrl: BACKEND_URL,
    backendQueryTimeoutMs: QUERY_TIMEOUT_MS,
  }),
)

mockNuxtImport('$fetch', () => ({ raw: fetchRaw }))

mockNuxtImport('useDataCache', () => async (key: string) => {
  dataCache.keys.push(key)
  return { value: dataCache.value, addToCache: dataCache.addToCache }
})

// Records what the handler asks of the CDN header helper, in order.
mockNuxtImport(
  'useCDNHeaders',
  () => (configure: (helper: unknown) => void) => {
    const helper = {
      public() {
        cdnCalls.push('public')
        return helper
      },
      private() {
        cdnCalls.push('private')
        return helper
      },
      setNumeric(name: string, value: number) {
        cdnCalls.push(`${name}=${value}`)
        return helper
      },
      set(name: string, value: number) {
        cdnCalls.push(`${name}=${value}`)
        return helper
      },
      addTags(tags: string[]) {
        cdnCalls.push(`tags:${tags.join(',')}`)
        return helper
      },
    }
    configure(helper)
  },
)

const ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<script>alert(1)</script><path d="M1 1h22v22H1z" fill="#ff0000"/></svg>'

function drupalResponse(body: string | undefined, headers = {}) {
  const response = new Response(null, { headers })
  return Object.assign(response, {
    _data: body === undefined ? undefined : new Blob([body]),
  })
}

function createEvent(params: unknown, headers: Record<string, string> = {}) {
  const responseHeaders = new Map<string, unknown>()
  const res = {
    statusCode: 200,
    getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
    setHeader: (name: string, value: unknown) =>
      responseHeaders.set(name.toLowerCase(), value),
  }
  const event = {
    context: { params: { params } },
    node: { req: { headers }, res },
  } as unknown as H3Event
  return { event, res, responseHeaders }
}

let handler: EventHandler

// The route reads the runtime config once, on import. Nitro auto-imports
// server/utils; vitest doesn't, so the real function is provided here.
beforeAll(async () => {
  vi.stubGlobal('extractCacheability', extractCacheability)
  handler = (await import('../../server/api/icon/[...params]')).default
})

beforeEach(() => {
  dataCache.value = undefined
  dataCache.keys.length = 0
  dataCache.addToCache.mockReset()
  cdnCalls.length = 0
  fetchRaw.mockReset().mockImplementation(async () =>
    drupalResponse(ICON, {
      'x-nuxt-expires': '3600',
      'x-nuxt-cache-tags': 'media:7',
      'surrogate-key': 'cdn-media-7',
    }),
  )
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('icon route', () => {
  it('answers 400 with an empty icon for a malformed id, without asking Drupal', async () => {
    const { event, res, responseHeaders } = createEvent('7/../../user/1')

    expect(await handler(event)).toBe('<svg></svg>')
    expect(res.statusCode).toBe(400)
    expect(fetchRaw).not.toHaveBeenCalled()
    expect(dataCache.keys).toEqual([])
    expect(responseHeaders.get('cache-control')).toBe('no-store')
    expect(cdnCalls).toEqual(['private'])
  })

  it('sends the sandbox and nosniff headers on every response, also a 400', async () => {
    const { event, responseHeaders } = createEvent('not-an-id')
    await handler(event)

    expect(responseHeaders.get('content-security-policy')).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    )
    expect(responseHeaders.get('x-content-type-options')).toBe('nosniff')
    expect(responseHeaders.get('content-type')).toBe('image/svg+xml')
  })

  it("fetches the media's icon from Drupal by its numeric id, bounded by the query timeout", async () => {
    const { event } = createEvent('7--logo.svg')
    await handler(event)

    expect(fetchRaw).toHaveBeenCalledOnce()
    const [url, options] = fetchRaw.mock.calls[0]!
    expect(url).toBe(`${BACKEND_URL}/media/7/icon`)
    expect(options.timeout).toBe(QUERY_TIMEOUT_MS)
  })

  it("forwards the host and referer, and never the visitor's cookie or authorization", async () => {
    const { event } = createEvent('7', {
      host: 'drupalmountaincamp.ch',
      referer: 'https://drupalmountaincamp.ch/sponsorship',
      cookie: 'SSESSabc=secret',
      authorization: 'Bearer secret',
    })
    await handler(event)

    expect(fetchRaw.mock.calls[0]![1].headers).toEqual({
      host: 'drupalmountaincamp.ch',
      referer: 'https://drupalmountaincamp.ch/sponsorship',
    })
  })

  it('returns the sanitised sprite, not the uploaded markup', async () => {
    const { event, res } = createEvent('7')
    const markup = await handler(event)

    expect(res.statusCode).toBe(200)
    expect(markup).toContain('<symbol id="icon"')
    expect(markup).toContain('fill="currentColor"')
    expect(markup).not.toContain('script')
    expect(markup).not.toContain('#ff0000')
  })

  it('lets browsers and the CDN cache a loaded icon, tagged for purging', async () => {
    const { event, responseHeaders } = createEvent('7')
    await handler(event)

    expect(responseHeaders.get('cache-control')).toBe('public, max-age=604800')
    expect(cdnCalls.slice(cdnCalls.lastIndexOf('public'))).toEqual([
      'public',
      'maxAge=31536000',
      'tags:cdn-media-7',
      'tags:nuxt:api:icon',
      'staleIfError=86400',
    ])
  })

  it('stores the built icon in the data cache under its id, with the Drupal tags', async () => {
    const { event } = createEvent('7')
    const markup = await handler(event)

    expect(dataCache.keys).toEqual(['api-icon-sanitised-7'])
    expect(dataCache.addToCache).toHaveBeenCalledExactlyOnceWith(
      { markup, tagsCdn: ['cdn-media-7'] },
      ['media:7'],
    )
  })

  it('serves a cached icon without asking Drupal again', async () => {
    dataCache.value = { markup: '<svg>cached</svg>', tagsCdn: ['cached-tag'] }
    const { event } = createEvent('7')

    expect(await handler(event)).toBe('<svg>cached</svg>')
    expect(fetchRaw).not.toHaveBeenCalled()
    expect(cdnCalls).toContain('tags:cached-tag')
  })

  it('keeps one cache entry per id, whatever the slug', async () => {
    await handler(createEvent('7--old-name.svg').event)
    await handler(createEvent('7--new-name.svg').event)
    await handler(createEvent('8').event)

    expect(dataCache.keys).toEqual([
      'api-icon-sanitised-7',
      'api-icon-sanitised-7',
      'api-icon-sanitised-8',
    ])
  })

  it.each([
    ['Drupal fails', () => Promise.reject(new Error('503'))],
    ['Drupal sends no body', async () => drupalResponse(undefined)],
    ['Drupal sends an empty body', async () => drupalResponse('')],
  ])(
    'answers an empty icon marked as not cacheable when %s',
    async (_label, respond) => {
      fetchRaw.mockImplementation(respond)
      const { event, responseHeaders } = createEvent('7')

      expect(await handler(event)).toBe('<svg></svg>')
      expect(responseHeaders.get('cache-control')).toBe('no-store')
      expect(cdnCalls).toEqual(['private'])
      expect(dataCache.addToCache).not.toHaveBeenCalled()
    },
  )
})
