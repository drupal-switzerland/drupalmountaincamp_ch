// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildImageSizes, fallbackImageSizes } from '../helpers/imageSizes'
import { SCREENS } from '../tailwind/screens'

describe('buildImageSizes', () => {
  it('lists the widest breakpoint first and ends with the viewport', () => {
    expect(
      buildImageSizes([
        { minWidth: 1024, width: '33vw' },
        { minWidth: 1380, width: '412px' },
      ]),
    ).toBe('(min-width: 1380px) 412px, (min-width: 1024px) 33vw, 100vw')
  })

  it('is the viewport width without rules', () => {
    expect(buildImageSizes([])).toBe('100vw')
  })

  it('ends with the width given for narrow viewports', () => {
    expect(
      buildImageSizes(
        [{ minWidth: 1024, width: '312px' }],
        'calc(100vw - 40px)',
      ),
    ).toBe('(min-width: 1024px) 312px, calc(100vw - 40px)')
  })

  it('leaves the rules it was given in their order', () => {
    const rules = [
      { minWidth: 1024, width: '33vw' },
      { minWidth: 1380, width: '412px' },
    ]
    buildImageSizes(rules)

    expect(rules.map((rule) => rule.minWidth)).toEqual([1024, 1380])
  })
})

describe('fallbackImageSizes', () => {
  it('caps at the largest configured width', () => {
    expect(fallbackImageSizes([728, 400, 320])).toBe(
      '(min-width: 728px) 728px, 100vw',
    )
  })

  it('caps at the container width without configured widths', () => {
    expect(fallbackImageSizes([])).toBe(
      `(min-width: ${SCREENS.xl}px) ${SCREENS.xl}px, 100vw`,
    )
  })
})
