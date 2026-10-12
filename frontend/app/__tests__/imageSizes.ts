// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildImageSizes, fallbackImageSizes } from '../helpers/imageSizes'
import { SCREENS } from '../tailwind/screens'

describe('buildImageSizes', () => {
  it('writes the rules in the order given and ends with the viewport', () => {
    expect(
      buildImageSizes([
        { minWidth: 1380, width: '412px' },
        { minWidth: 1024, width: '33vw' },
      ]),
    ).toBe('(min-width: 1380px) 412px, (min-width: 1024px) 33vw, 100vw')
  })

  it('takes a breakpoint in another unit as written', () => {
    expect(
      buildImageSizes([{ minWidth: '50.5rem', width: 'calc(48rem - 8px)' }]),
    ).toBe('(min-width: 50.5rem) calc(48rem - 8px), 100vw')
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
