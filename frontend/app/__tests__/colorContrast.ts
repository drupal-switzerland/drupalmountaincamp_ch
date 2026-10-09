// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { brand, colors } from '../../tailwind.config'

const WHITE = '#FFFFFF'
const AA_TEXT = 4.5
const AA_LARGE_TEXT = 3
const AA_NON_TEXT = 3

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (light! + 0.05) / (dark! + 0.05)
}

// Every text/background pairing the design uses, with the WCAG minimum.
const pairs: [string, string, string, number][] = [
  ['navy text on white', brand.navy, WHITE, AA_TEXT],
  ['navy text on tint', brand.navy, brand.tint, AA_TEXT],
  ['navy text on ice', brand.navy, brand.ice, AA_TEXT],
  ['navy text on lilac', brand.navy, brand.lilac, AA_TEXT],
  ['blue text on white', brand.blue, WHITE, AA_TEXT],
  ['blue text on tint', brand.blue, brand.tint, AA_TEXT],
  ['blue text on ice', brand.blue, brand.ice, AA_TEXT],
  ['white text on navy', WHITE, brand.navy, AA_TEXT],
  ['white text on blue', WHITE, brand.blue, AA_TEXT],
  ['sky text on navy', brand.sky, brand.navy, AA_TEXT],
  ['ice text on navy', brand.ice, brand.navy, AA_TEXT],
  ['lilac text on navy', brand.lilac, brand.navy, AA_TEXT],
  ['sky large heading on white', brand.sky, WHITE, AA_LARGE_TEXT],
  // Navigation loading bar (blue) over the event strip, header and menus.
  ['loading bar on white', brand.blue, WHITE, AA_NON_TEXT],
  ['loading bar on tint', brand.blue, brand.tint, AA_NON_TEXT],
  ['loading bar on gray-50', brand.blue, colors.gray[50], AA_NON_TEXT],
]

describe('brand colour contrast', () => {
  it.each(pairs)('%s meets WCAG AA', (_label, foreground, background, min) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min)
  })

  it('rejects sky as small text on white', () => {
    expect(contrast(brand.sky, WHITE)).toBeLessThan(AA_TEXT)
  })
})
