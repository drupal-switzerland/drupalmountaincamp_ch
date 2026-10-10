// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { EventHandler, H3Event } from 'h3'
import {
  cdnDirectives,
  createResponseRecorder,
  useRealCdnHeaders,
} from './support/cdnHeaders'

let handler: EventHandler

// The build vitest runs resolves useCDNHeaders to a function that does
// nothing, so the handler gets the real helper instead.
mockNuxtImport('useCDNHeaders', async () => {
  const { useRealCdnHeaders } = await import('./support/cdnHeaders')
  return useRealCdnHeaders
})

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (fn: EventHandler) => fn)
  handler = (await import('../../server/middleware/spa')).default
  vi.unstubAllGlobals()
})

type SpaEvent = H3Event & {
  context: { nuxt?: { noSSR?: boolean }; hasSession?: boolean }
}

const responses = new WeakMap<H3Event, Map<string, unknown>>()

function createEvent(path: string, headers: Record<string, string> = {}) {
  const response = createResponseRecorder()
  const event = {
    path,
    context: {},
    node: { req: { headers: { ...headers } }, res: response.res },
  } as unknown as SpaEvent
  responses.set(event, response.headers)
  return event
}

function responseHeaders(event: H3Event) {
  return responses.get(event)!
}

describe('SPA middleware', () => {
  it.each([
    ['HTTPS', 'a=1; SSESSabc=def'],
    ['plain HTTP', 'SESS0123456789abcdef0123456789abcdef=def'],
  ])(
    'disables SSR for a Drupal session cookie set over %s',
    (_label, cookie) => {
      const event = createEvent('/news', { cookie })
      handler(event)

      expect(event.context.nuxt?.noSSR).toBe(true)
      expect(event.context.hasSession).toBe(true)
    },
  )

  it.each<[string, Record<string, string>]>([
    ['with only unrelated cookies', { cookie: 'a=1' }],
    [
      'whose cookies only contain "SSESS" inside another cookie',
      { cookie: 'ref=SSESSabc; XSSESSION=1' },
    ],
    ['without any cookie', {}],
  ])('keeps SSR for a visitor %s', (_label, headers) => {
    const event = createEvent('/news', headers)

    expect(() => handler(event)).not.toThrow()
    expect(event.context.nuxt).toBeUndefined()
    expect(event.context.hasSession).toBeUndefined()
  })

  it.each(['/de/page?blokkliEditing=1', '/de/page?blokkliPreview=1'])(
    'disables SSR in the blökkli editor: %s',
    (path) => {
      const event = createEvent(path, { cookie: 'a=1' })
      handler(event)

      expect(event.context.nuxt?.noSSR).toBe(true)
      expect(event.context.hasSession).toBe(false)
    },
  )

  it.each([
    '/api/graphql_query/route',
    '/_nuxt/__nuxt/entry.js',
    '/fonts/inter.woff2',
    '/favicon.ico',
    '/icon.svg',
  ])('leaves API and asset requests alone: %s', (path) => {
    const event = createEvent(path, {
      cookie: 'SSESSabc=def',
      'x-nuxt-no-ssr': '1',
    })
    handler(event)

    expect(event.context.nuxt).toBeUndefined()
    expect(event.node.req.headers['x-nuxt-no-ssr']).toBe('1')
  })

  it('leaves a request without a path alone, even with a session', () => {
    const event = createEvent('', { cookie: 'SSESSabc=def' })
    handler(event)

    expect(event.context.nuxt).toBeUndefined()
  })

  it('removes a client-sent header that forces SPA mode', () => {
    const event = createEvent('/news', {
      cookie: 'a=1',
      'x-nuxt-no-ssr': '1',
    })
    handler(event)

    expect(event.node.req.headers['x-nuxt-no-ssr']).toBeUndefined()
  })

  it.each<[string, string, Record<string, string>]>([
    [
      'the page shell of a Drupal session over HTTPS',
      '/news',
      { cookie: 'SSESS0123456789abcdef0123456789abcdef=x' },
    ],
    [
      'the page shell of a Drupal session over plain HTTP',
      '/news',
      { cookie: 'SESS0123456789abcdef0123456789abcdef=x' },
    ],
    [
      'the page shell of the blökkli editor',
      '/news?blokkliEditing=1',
      { cookie: 'a=1' },
    ],
    [
      'the page shell of the blökkli preview',
      '/news?blokkliPreview=1',
      { cookie: 'a=1' },
    ],
    ['a blökkli editor URL without any cookie', '/news?blokkliEditing=1', {}],
    ['a blökkli preview URL without any cookie', '/news?blokkliPreview=1', {}],
  ])('marks %s as not cacheable', (_label, path, headers) => {
    const event = createEvent(path, headers)
    handler(event)

    expect(responseHeaders(event).get('cache-control')).toBe(
      'private, no-store',
    )
    expect(cdnDirectives(responseHeaders(event))).toEqual(['private'])
  })

  it('stays private for the CDN when the page later declares itself public', () => {
    const event = createEvent('/news', { cookie: 'SSESSabc=def' })
    handler(event)
    useRealCdnHeaders(
      (cdn) => cdn.public().setNumeric('maxAge', 31536000),
      event,
    )

    expect(cdnDirectives(responseHeaders(event))).toContain('private')
    expect(cdnDirectives(responseHeaders(event))).not.toContain('public')
  })

  it.each<[string, string, Record<string, string>]>([
    ['a visitor without cookies', '/news', {}],
    ['a visitor with unrelated cookies', '/news', { cookie: 'consent=1' }],
    ['an API request with a session', '/api/icon/7', { cookie: 'SSESSa=x' }],
    ['an asset request with a session', '/icon.svg', { cookie: 'SSESSa=x' }],
  ])('sets no cache headers of its own for %s', (_label, path, headers) => {
    const event = createEvent(path, headers)
    handler(event)

    expect(responseHeaders(event).size).toBe(0)
  })
})
