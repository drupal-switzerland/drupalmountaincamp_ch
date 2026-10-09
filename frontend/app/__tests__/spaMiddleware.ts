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
  it('disables SSR for requests with a Drupal session', () => {
    const event = createEvent('/news', { cookie: 'a=1; SSESSabc=def' })
    handler(event)

    expect(event.context.nuxt?.noSSR).toBe(true)
    expect(event.context.hasSession).toBe(true)
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

  it('keeps SSR for visitors without a session', () => {
    const event = createEvent('/news', { cookie: 'a=1' })
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
