// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getPageCacheability } from '../helpers/graphqlCacheability'

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
