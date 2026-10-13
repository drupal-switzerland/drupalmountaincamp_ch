// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { sizesProblems } from './support/sizes'

describe('sizesProblems', () => {
  it.each([
    '100vw',
    '207px',
    '(min-width: 1024px) 33vw, 100vw',
    '(min-width: 1024px) calc(20rem - 8px), (min-width: 50.5rem) calc(48rem - 8px), calc(100vw - 40px)',
    '(min-width: 1380px) 406px, (min-width: 1280px) calc((100vw - 144px) / 3 - 6px), calc(100vw - 38px)',
  ])('accepts %s', (sizes) => {
    expect(sizesProblems(sizes)).toEqual([])
  })

  it.each([
    ['a minus without spaces', '(min-width: 1024px) calc(20rem-8px), 100vw'],
    ['a plus without spaces', 'calc(100vw +8px)'],
    ['an unclosed calc', '(min-width: 1024px) calc(20rem - 8px, 100vw'],
    ['a condition on the last entry', '(min-width: 1024px) 33vw'],
    ['an entry without a condition before the last', '33vw, 100vw'],
    ['a width without a unit', '(min-width: 1024px) 312, 100vw'],
    ['an empty entry', '(min-width: 1024px) 33vw, , 100vw'],
  ])('reports %s', (_, sizes) => {
    expect(sizesProblems(sizes)).not.toEqual([])
  })
})
