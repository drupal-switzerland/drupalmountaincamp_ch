// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { EventHandler, H3Event } from 'h3'

let handler: EventHandler

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', (fn: EventHandler) => fn)
  handler = (await import('../../server/middleware/spa')).default
  vi.unstubAllGlobals()
})

type SpaEvent = H3Event & {
  context: { nuxt?: { noSSR?: boolean }; hasSession?: boolean }
}

function createEvent(path: string, headers: Record<string, string> = {}) {
  return {
    path,
    context: {},
    node: { req: { headers: { ...headers } } },
  } as unknown as SpaEvent
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
})
