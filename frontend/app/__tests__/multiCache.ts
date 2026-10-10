// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import {
  buildRouteCacheKey,
  isCacheEnabledForRequest,
} from '../../server/utils/multiCache'

// server/multiCache.serverOptions.ts itself is not imported: nuxt-multi-cache
// swaps it for an empty stub in the build vitest runs through.

// Drupal names its session cookie "SSESS" plus 32 hex characters on HTTPS.
const SESSION_COOKIE = 'SSESS0123456789abcdef0123456789abcdef=session-id'

function createEvent(path: string, cookie?: string) {
  return {
    path,
    node: { req: { headers: cookie === undefined ? {} : { cookie } } },
  } as unknown as H3Event
}

describe('multi cache: enabled for a request', () => {
  it('is off for a request with a Drupal session cookie', () => {
    expect(isCacheEnabledForRequest(createEvent('/', SESSION_COOKIE))).toBe(
      false,
    )
  })

  it('is off when the session cookie comes after other cookies', () => {
    const cookie = `consent=1; theme=dark; ${SESSION_COOKIE}`

    expect(isCacheEnabledForRequest(createEvent('/', cookie))).toBe(false)
  })

  it('is off for the session cookie Drupal sets over plain HTTP', () => {
    const cookie = 'SESS0123456789abcdef0123456789abcdef=session-id'

    expect(isCacheEnabledForRequest(createEvent('/', cookie))).toBe(false)
  })

  it.each([
    ['in the value of another cookie', 'ref=SSESSabc; theme=dark'],
    ['inside the name of another cookie', 'XSSESSION=1; MYSESS1=2'],
  ])('stays on when "SSESS" only appears %s', (_label, cookie) => {
    expect(isCacheEnabledForRequest(createEvent('/', cookie))).toBe(true)
  })

  it('is on for a visitor without cookies', () => {
    expect(isCacheEnabledForRequest(createEvent('/'))).toBe(true)
  })

  it('is on for a visitor with only unrelated cookies', () => {
    const cookie = 'consent=1; theme=dark'

    expect(isCacheEnabledForRequest(createEvent('/', cookie))).toBe(true)
  })
})

describe('multi cache: route cache key', () => {
  function key(path: string, cookie?: string) {
    return buildRouteCacheKey(createEvent(path, cookie))
  }

  it('differs per path', () => {
    expect(key('/news')).not.toBe(key('/program'))
  })

  it('differs per query string', () => {
    expect(key('/news?page=2')).not.toBe(key('/news?page=3'))
    expect(key('/news?page=2')).not.toBe(key('/news'))
  })

  it.each([
    ['/news/page=2', '/news?page=2'],
    ['/a/b', '/a?b'],
    ['/a?b=1&c=2', '/a?b=1/c=2'],
    ['/a__b', '/a/b'],
  ])('differs between %s and %s', (first, second) => {
    expect(key(first)).not.toBe(key(second))
  })

  it('never shares an entry between a visitor with cookies and one without', () => {
    expect(key('/news', SESSION_COOKIE)).not.toBe(key('/news'))
  })

  it('never shares an entry between two different cookies', () => {
    expect(key('/news', 'SSESSa=one')).not.toBe(key('/news', 'SSESSa=two'))
  })
})
