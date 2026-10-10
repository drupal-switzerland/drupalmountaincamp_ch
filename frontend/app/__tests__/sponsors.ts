// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  LOGO_BOXES,
  groupByTier,
  logoSize,
  logoSrcset,
  splitHighlight,
} from '../helpers/sponsors'

describe('logoSize', () => {
  it('gives a square logo the full area when it fits', () => {
    const { width, height } = logoSize(100, 100, LOGO_BOXES.card)
    expect(width).toBe(100)
    expect(height).toBe(100)
  })

  it('caps a wide logo at the maximum width and keeps its ratio', () => {
    expect(logoSize(1000, 100, LOGO_BOXES.standard)).toEqual({
      width: 168,
      height: 17,
    })
  })

  it('caps a tall logo at the maximum height and keeps its ratio', () => {
    expect(logoSize(66, 86, LOGO_BOXES.standard)).toEqual({
      width: 49,
      height: 64,
    })
  })

  it('never exceeds the box', () => {
    for (const [w, h] of [
      [1002, 436],
      [1, 50],
      [50, 1],
    ] as const) {
      for (const box of Object.values(LOGO_BOXES)) {
        const size = logoSize(w, h, box)
        expect(size.width).toBeLessThanOrEqual(box.maxWidth)
        expect(size.height).toBeLessThanOrEqual(box.maxHeight)
      }
    }
  })
})

describe('groupByTier', () => {
  it('groups items by tier and skips items without one', () => {
    const items = [
      { id: 1, tier: 'gold' },
      { id: 2, tier: 'platinum' },
      { id: 3, tier: 'gold' },
      { id: 4, tier: null },
    ]
    expect(groupByTier(items)).toEqual({
      gold: [items[0], items[2]],
      platinum: [items[1]],
    })
  })
})

describe('splitHighlight', () => {
  it('splits around the first occurrence of the word', () => {
    expect(splitHighlight('Put your brand on top of the world', 'top')).toEqual(
      {
        before: 'Put your brand on ',
        highlight: 'top',
        after: ' of the world',
      },
    )
  })

  it('returns null when the word is missing or empty', () => {
    expect(splitHighlight('Werden Sie Sponsor', 'top')).toBeNull()
    expect(splitHighlight('Put your brand on top', '')).toBeNull()
  })
})

describe('logoSrcset', () => {
  const large = { urlPath: '/styles/large/logo.png.webp', width: 480 }
  const wide = { urlPath: '/styles/wide/logo.png.webp', width: 1090 }

  it('lists the derivatives smallest first with their widths', () => {
    expect(logoSrcset([wide, large])).toBe(
      '/styles/large/logo.png.webp 480w, /styles/wide/logo.png.webp 1090w',
    )
  })

  it('keeps one entry per width, for a source smaller than both styles', () => {
    const small = { urlPath: '/styles/large/small.png.webp', width: 66 }
    const same = { urlPath: '/styles/wide/small.png.webp', width: 66 }
    expect(logoSrcset([small, same])).toBe('/styles/wide/small.png.webp 66w')
  })

  it('skips missing derivatives', () => {
    expect(logoSrcset([null, undefined, { urlPath: null, width: 480 }])).toBe(
      '',
    )
    expect(logoSrcset([null, wide])).toBe('/styles/wide/logo.png.webp 1090w')
  })

  it('maps each URL through the given path function', () => {
    expect(
      logoSrcset(
        [{ urlPath: 'https://internal.example/a.png', width: 480 }],
        (url) => new URL(url).pathname,
      ),
    ).toBe('/a.png 480w')
  })
})
