// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parsePageParam, totalPages } from '../helpers/pagination'

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
