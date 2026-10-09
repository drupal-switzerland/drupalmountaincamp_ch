// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
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
