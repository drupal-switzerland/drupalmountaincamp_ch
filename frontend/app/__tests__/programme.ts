// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { dayNumber } from '../helpers/programme'

describe('dayNumber', () => {
  it.each([
    ['Tuesday, March 2', 0, '2'],
    ['Wednesday, March 3 ', 1, '3'],
    ['Thursday, 14', 2, '14'],
  ])('takes the day from "%s"', (title, index, expected) => {
    expect(dayNumber(title, index)).toBe(expected)
  })

  it.each([
    ['Opening day', 0, '1'],
    ['', 2, '3'],
    [null, 1, '2'],
    [undefined, 0, '1'],
    ['Room 2027', 3, '4'],
  ])('falls back to the position for %j', (title, index, expected) => {
    expect(dayNumber(title, index)).toBe(expected)
  })
})
