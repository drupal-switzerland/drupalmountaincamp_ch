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
    'calc((100vw - 112px)/3 - 6px)',
    'calc(2 * (10rem + 4px))',
    'calc( 100vw - 40px )',
  ])('accepts %s', (sizes) => {
    expect(sizesProblems(sizes)).toEqual([])
  })

  it.each([
    ['a unit that does not exist', 'calc(20rem - 8xp)'],
    ['a length minus a plain number', 'calc(20rem - 8)'],
    ['two values without an operator', 'calc(20rem 8px)'],
    ['an empty calc', 'calc()'],
    ['a division by a length', 'calc(100vw / 3px)'],
    ['a length times a length', 'calc(100vw * 3px)'],
    ['a calc that gives a plain number', 'calc(2 * 3)'],
    ['an operator without a right side', 'calc(100vw - )'],
    ['a minus at the end without a space after it', 'calc(100vw -)'],
    ['a parenthesis closed too early', 'calc(100vw - 8px))'],
    ['an unclosed parenthesis inside a calc', 'calc((100vw - 8px)'],
    ['a nested function', 'calc(min(100vw, 20rem) - 8px)'],
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
