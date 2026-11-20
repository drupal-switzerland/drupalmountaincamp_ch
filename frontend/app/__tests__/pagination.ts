// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { LocationQuery } from 'vue-router'
import {
  canonicalPath,
  canonicalPageQuery,
  canonicalPageUrl,
  getListPageState,
  isSameTabClick,
  parsePageParam,
  totalPages,
  withPageParam,
} from '../helpers/pagination'

describe('parsePageParam', () => {
  it('reads a positive integer', () => {
    expect(parsePageParam('3')).toBe(3)
  })

  it('uses the first value of a repeated parameter', () => {
    expect(parsePageParam(['2', '5'])).toBe(2)
  })

  it.each([undefined, null, '', '0', '-1', '1.5', 'abc', '2abc', ' 2', '1e3'])(
    'falls back to 1 for %j',
    (value) => {
      expect(parsePageParam(value)).toBe(1)
    },
  )

  it('falls back to 1 beyond the safe integer range', () => {
    expect(parsePageParam('99999999999999999999')).toBe(1)
  })
})

describe('totalPages', () => {
  it('rounds up', () => {
    expect(totalPages(32, 10)).toBe(4)
    expect(totalPages(30, 10)).toBe(3)
  })

  it('is at least 1 when there is nothing to show', () => {
    expect(totalPages(0, 10)).toBe(1)
  })
})

describe('isSameTabClick', () => {
  const click = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
  }

  it('accepts a plain primary click', () => {
    expect(isSameTabClick(click)).toBe(true)
  })

  it.each([
    { button: 1 },
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
  ])('rejects %j', (change) => {
    expect(isSameTabClick({ ...click, ...change })).toBe(false)
  })
})

describe('withPageParam', () => {
  it('sets the page and keeps other parameters', () => {
    expect(withPageParam({ a: 'x', page: '2' }, 3)).toEqual({
      a: 'x',
      page: '3',
    })
  })

  it('removes the parameter for page 1', () => {
    expect(withPageParam({ a: 'x', page: '2' }, 1)).toEqual({ a: 'x' })
  })

  it('does not change the given query', () => {
    const query = { page: '2' }
    withPageParam(query, 1)
    expect(query).toEqual({ page: '2' })
  })
})

describe('canonicalPageQuery', () => {
  it.each<LocationQuery>([
    {},
    { page: '2' },
    { page: '99' },
    { a: 'x', page: '3' },
  ])('keeps canonical %j', (query) => {
    expect(canonicalPageQuery(query)).toBeNull()
  })

  it.each([
    [{ page: '1' }, {}],
    [{ page: '02' }, { page: '2' }],
    [{ page: 'abc' }, {}],
    [{ page: '' }, {}],
    [{ page: null }, {}],
    [{ page: ['2', '3'] }, { page: '2' }],
    [{ page: '99999999999999999999' }, {}],
    [{ a: 'x', page: '1' }, { a: 'x' }],
  ])('redirects %j to %j', (query, expected) => {
    expect(canonicalPageQuery(query)).toEqual(expected)
  })

  it('redirects to a canonical query (no redirect loop)', () => {
    const redirect = canonicalPageQuery({ page: ['02', 'x'] })
    expect(redirect).not.toBeNull()
    expect(canonicalPageQuery(redirect!)).toBeNull()
  })
})

describe('getListPageState', () => {
  const loaded = {
    page: 2,
    pageSize: 10,
    status: 'success',
    total: 16,
  } as const

  it('is ok for a page within the list', () => {
    expect(getListPageState(loaded)).toBe('ok')
  })

  it('is notFound beyond the last page', () => {
    expect(getListPageState({ ...loaded, page: 3 })).toBe('notFound')
  })

  it('treats page 1 of an empty list as ok', () => {
    expect(getListPageState({ ...loaded, page: 1, total: 0 })).toBe('ok')
  })

  it('is notFound when the offset exceeds a GraphQL Int, without a list', () => {
    expect(
      getListPageState({
        ...loaded,
        page: 214_748_366,
        status: 'idle',
        total: null,
      }),
    ).toBe('notFound')
    expect(
      getListPageState({ ...loaded, page: 214_748_365, total: null }),
    ).toBe('failed')
  })

  it('is failed, not notFound, for a failed request or a missing list', () => {
    expect(getListPageState({ ...loaded, page: 99, status: 'error' })).toBe(
      'failed',
    )
    expect(getListPageState({ ...loaded, page: 99, total: null })).toBe(
      'failed',
    )
  })

  it.each(['idle', 'pending'] as const)('is pending while %s', (status) => {
    expect(getListPageState({ ...loaded, page: 99, status })).toBe('pending')
  })
})

describe('canonicalPageUrl', () => {
  const origin = 'https://example.com'

  it('has no page parameter on page 1', () => {
    expect(canonicalPageUrl(origin, '/news', 1)).toBe(
      'https://example.com/news',
    )
  })

  it.each([2, 10])('adds the page parameter on page %i', (page) => {
    expect(canonicalPageUrl(origin, '/news', page)).toBe(
      `https://example.com/news?page=${page}`,
    )
  })

  it('builds the site root URL', () => {
    expect(canonicalPageUrl(origin, '/', 1)).toBe('https://example.com/')
  })

  it('keeps a port in the origin', () => {
    expect(canonicalPageUrl('http://localhost:3000', '/news', 2)).toBe(
      'http://localhost:3000/news?page=2',
    )
  })
})

describe('canonicalPath', () => {
  it.each([
    ['/news/', '/news'],
    ['/news//', '/news'],
    ['/news', '/news'],
    ['/news/article/', '/news/article'],
    ['/', '/'],
  ])('%s becomes %s', (path, expected) => {
    expect(canonicalPath(path)).toBe(expected)
  })
})
