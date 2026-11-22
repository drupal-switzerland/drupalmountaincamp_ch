import { describe, expect, it } from 'vitest'
import { LOGO_BOXES, type LogoBox, logoSize } from '../helpers/sponsors'

// Pill sizes of SponsorList, minus the 3px gradient border on each side.
const PILLS: [string, LogoBox, number, number][] = [
  ['platinum', LOGO_BOXES.pillPlatinum, 320, 150],
  ['silver', LOGO_BOXES.pillLarge, 250, 116],
  ['bronze', LOGO_BOXES.pillSmall, 190, 88],
]
const RATIOS = [0.5, 1, 1.5, 2, 3, 4, 6, 10]

/** Whether a centred w x h box stays inside a pill of the given size. */
function fitsInPill(w: number, h: number, pillW: number, pillH: number) {
  const r = pillH / 2
  const dx = Math.max(0, w / 2 - (pillW / 2 - r))
  return dx <= r && Math.hypot(dx, h / 2) <= r
}

describe('sponsor logos inside the pill tiles', () => {
  for (const [tier, box, pillW, pillH] of PILLS) {
    it(`keeps every logo shape clear of the ${tier} pill's curve`, () => {
      const inner = [pillW - 6, pillH - 6] as const
      for (const ratio of RATIOS) {
        const size = logoSize(ratio * 100, 100, box)
        expect(fitsInPill(size.width, size.height, ...inner), `${ratio}`).toBe(
          true,
        )
      }
      // SVGs without stored dimensions fill the whole box.
      expect(fitsInPill(box.maxWidth, box.maxHeight, ...inner)).toBe(true)
    })
  }
})
