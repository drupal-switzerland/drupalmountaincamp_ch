// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import {
  applyPageCacheability,
  getPageCacheability,
} from '../helpers/graphqlCacheability'
import {
  cdnDirectives,
  createResponseRecorder,
  useRealCdnHeaders,
} from './support/cdnHeaders'

const cacheable = {
  isCacheable: true,
  maxAge: 3600,
  tagsNuxt: [],
  tagsCdn: ['node:1'],
  tagsDrupal: [],
}

describe('getPageCacheability', () => {
  it('passes on a cacheable response', () => {
    expect(getPageCacheability({ __cacheability: cacheable })).toBe(cacheable)
  })

  it.each([
    ['no response data', undefined],
    ['null response data', null],
    ['no cacheability', {}],
    ['uncacheable', { __cacheability: { ...cacheable, isCacheable: false } }],
    [
      'GraphQL errors',
      { errors: [{ message: 'boom' }], __cacheability: cacheable },
    ],
  ])('is null for %s', (_, data) => {
    expect(getPageCacheability(data)).toBeNull()
  })
})

describe('applyPageCacheability', () => {
  type Cacheability = ReturnType<typeof getPageCacheability>

  // One page render: every GraphQL response of it reports to the same event.
  function renderPage(responses: Cacheability[]) {
    const { res, headers } = createResponseRecorder()
    const event = { context: {}, node: { res } } as unknown as H3Event
    responses.forEach((cacheability) =>
      useRealCdnHeaders(
        (helper) => applyPageCacheability(helper, cacheability),
        event,
      ),
    )
    return {
      directives: cdnDirectives(headers),
      tags: String(headers.get('cache-tag') ?? '')
        .split(' ')
        .filter(Boolean)
        .sort(),
    }
  }

  it('makes the page public for the max age and tags of the response', () => {
    expect(renderPage([cacheable])).toEqual({
      directives: ['max-age=3600', 'public'],
      tags: ['node:1'],
    })
  })

  it('makes the page private without cacheability', () => {
    expect(renderPage([null])).toEqual({ directives: ['private'], tags: [] })
  })

  it('keeps the shortest max age and all tags of several responses', () => {
    const page = renderPage([
      cacheable,
      { ...cacheable, maxAge: 60, tagsCdn: ['node:2', 'node:1'] },
      { ...cacheable, maxAge: 7200, tagsCdn: ['config:main'] },
    ])

    expect(page.directives).toEqual(['max-age=60', 'public'])
    expect(page.tags).toEqual(['config:main', 'node:1', 'node:2'])
  })

  it.each([
    ['before', [null, cacheable]],
    ['after', [cacheable, null]],
    ['between', [cacheable, null, cacheable]],
  ])(
    'keeps the page private when an uncacheable response comes %s cacheable ones',
    (_, responses) => {
      const { directives } = renderPage(responses)

      expect(directives).toContain('private')
      expect(directives).not.toContain('public')
    },
  )
})
