// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import { extractCacheability } from '../../server/utils/cacheability'
import { MAX_AGE } from '../../server/helpers'

function createEvent(cookie?: string) {
  return { node: { req: { headers: { cookie } } } } as unknown as H3Event
}

function createResponse(headers: Record<string, string>) {
  return new Response(null, { headers }) as never
}

describe('extractCacheability', () => {
  it('reads max age and tags from the Drupal headers', () => {
    const result = extractCacheability(
      createResponse({
        'x-nuxt-expires': '3600',
        'x-nuxt-cache-tags': 'node:1  config:main',
        'surrogate-key': 'abc def',
        'x-drupal-cache-tags': 'node:1 node_list',
      }),
      createEvent(),
    )

    expect(result).toEqual({
      isCacheable: true,
      maxAge: 3600,
      tagsNuxt: ['node:1', 'config:main'],
      tagsCdn: ['abc', 'def'],
      tagsDrupal: ['node:1', 'node_list'],
    })
  })

  it('uses the Drupal tags for the CDN when there is no surrogate key', () => {
    const result = extractCacheability(
      createResponse({
        'x-nuxt-expires': '60',
        'x-drupal-cache-tags': 'node:1',
      }),
      createEvent(),
    )

    expect(result.tagsCdn).toEqual(['node:1'])
  })

  it('caches permanent responses for a year', () => {
    const result = extractCacheability(
      createResponse({ 'x-nuxt-expires': '-1' }),
      createEvent(),
    )

    expect(result.maxAge).toBe(MAX_AGE.ONE_YEAR)
    expect(result.isCacheable).toBe(true)
  })

  it.each([
    ['no expires header', {}],
    ['expires 0', { 'x-nuxt-expires': '0' }],
    ['a non-numeric expires header', { 'x-nuxt-expires': 'soon' }],
  ])('is uncacheable with %s', (_, headers) => {
    const result = extractCacheability(createResponse(headers), createEvent())

    expect(result.maxAge).toBe(MAX_AGE.UNCACHEABLE)
    expect(result.isCacheable).toBe(false)
  })

  it('is uncacheable for a request with a Drupal session', () => {
    const result = extractCacheability(
      createResponse({ 'x-nuxt-expires': '3600' }),
      createEvent('other=1; SSESS123=abc'),
    )

    expect(result.maxAge).toBe(3600)
    expect(result.isCacheable).toBe(false)
  })

  it('is uncacheable for the session cookie Drupal sets over plain HTTP', () => {
    const result = extractCacheability(
      createResponse({ 'x-nuxt-expires': '3600' }),
      createEvent('SESS0123456789abcdef0123456789abcdef=abc'),
    )

    expect(result.isCacheable).toBe(false)
  })

  it('stays cacheable when "SSESS" only appears in another cookie', () => {
    const result = extractCacheability(
      createResponse({ 'x-nuxt-expires': '3600' }),
      createEvent('ref=SSESSabc; XSSESSION=1'),
    )

    expect(result.isCacheable).toBe(true)
  })

  it('has no tags without tag headers', () => {
    const result = extractCacheability(
      createResponse({ 'x-nuxt-expires': '3600' }),
      createEvent(),
    )

    expect(result.tagsNuxt).toEqual([])
    expect(result.tagsCdn).toEqual([])
    expect(result.tagsDrupal).toEqual([])
  })
})
