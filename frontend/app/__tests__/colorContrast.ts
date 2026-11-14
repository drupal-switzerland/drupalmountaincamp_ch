// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config, { brand, colors } from '../../tailwind.config'
import { SKY_HANDOVER } from '../helpers/heroSky'

const WHITE = '#FFFFFF'
const TABLE_BORDER = (config.theme?.colors as Record<string, string>)[
  'table-border'
]!
const AA_TEXT = 4.5
const AA_LARGE_TEXT = 3
const AA_NON_TEXT = 3
// The colour loading-indicator.css gives the navigation loading bar.
const LOADING_BAR = colors.primary[400]
const LOADING_BAR_EDGE = WHITE

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
  // Week timeline: day numbers on sky stops, the rail and the dashed start.
  ['navy day number on sky', brand.navy, brand.sky, AA_LARGE_TEXT],
  ['sky timeline rail on navy', brand.sky, brand.navy, AA_NON_TEXT],
  ['ice start stop on navy', brand.ice, brand.navy, AA_NON_TEXT],
  // Get tickets: navy pill on the ice hero bar, white pill on navy.
  ['navy ticket button on ice', brand.navy, brand.ice, AA_NON_TEXT],
  ['white ticket button on navy', WHITE, brand.navy, AA_NON_TEXT],
  // Navy header: white links, sky hover and current mark, white Tickets pill
  // turning ice on hover, white focus ring; submenus are gray-50 panels.
  ['header link on navy', WHITE, brand.navy, AA_TEXT],
  ['header link hover on navy', brand.sky, brand.navy, AA_TEXT],
  ['header current mark on navy', brand.sky, brand.navy, AA_NON_TEXT],
  ['header scrolled edge on navy', brand.sky, brand.navy, AA_NON_TEXT],
  ['header tickets pill on navy', WHITE, brand.navy, AA_NON_TEXT],
  ['header tickets text on white', brand.navy, WHITE, AA_TEXT],
  ['header tickets hover text on ice', brand.navy, brand.ice, AA_TEXT],
  ['white focus outline on navy', WHITE, brand.navy, AA_NON_TEXT],
  // Skip link: white ring over the navy header, its navy rim over the light
  // event strip and the white page.
  ['skip link rim on event strip', brand.navy, colors.primary[50], AA_NON_TEXT],
  ['skip link rim on white', brand.navy, WHITE, AA_NON_TEXT],
  ['submenu link on gray-50', brand.navy, colors.gray[50], AA_TEXT],
  ['submenu link hover on gray-50', brand.blue, colors.gray[50], AA_TEXT],
  ['navy focus outline on gray-50', brand.navy, colors.gray[50], AA_NON_TEXT],
  // Navigation loading bar (blue) over the event strip, header and menus.
  // Over the navy header its white bottom edge is what stands out.
  ['loading bar on white', LOADING_BAR, WHITE, AA_NON_TEXT],
  ['loading bar on tint', LOADING_BAR, brand.tint, AA_NON_TEXT],
  ['loading bar on gray-50', LOADING_BAR, colors.gray[50], AA_NON_TEXT],
  ['loading bar edge on navy', LOADING_BAR_EDGE, brand.navy, AA_NON_TEXT],
  ['loading bar on its edge', LOADING_BAR, LOADING_BAR_EDGE, AA_NON_TEXT],
  // Image and video copyright captions.
  ['gray-600 caption on white', colors.gray[600], WHITE, AA_TEXT],
  ['gray-600 caption on ice', colors.gray[600], brand.ice, AA_TEXT],
  ['gray-600 caption on tint', colors.gray[600], brand.tint, AA_TEXT],
  // Inner pages: the first blocks sit on the snow fade (ice, then tint, then
  // white) that continues from the hero.
  ['body text on ice', colors.gray[900], brand.ice, AA_TEXT],
  ['body text on tint', colors.gray[900], brand.tint, AA_TEXT],
  ['link text on ice', colors.link.DEFAULT, brand.ice, AA_TEXT],
  ['link hover text on ice', colors.link.hover, brand.ice, AA_TEXT],
  ['navy focus outline on ice', brand.navy, brand.ice, AA_NON_TEXT],
  ['table border on ice', TABLE_BORDER, brand.ice, AA_NON_TEXT],
  // Inner-page hero: text on its gradient, from navy to brand blue.
  ['ice lead text on blue', brand.ice, brand.blue, AA_TEXT],
  ['white title on blue', WHITE, brand.blue, AA_LARGE_TEXT],
  // Theme line: ice on the dark heroes, brand blue on a white press release.
  ['theme line on navy', brand.ice, brand.navy, AA_TEXT],
  ['theme line on blue', brand.ice, brand.blue, AA_TEXT],
  ['theme line on white', brand.blue, WHITE, AA_TEXT],
]

describe('brand colour contrast', () => {
  it.each(pairs)('%s meets WCAG AA', (_label, foreground, background, min) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min)
  })

  it('rejects sky as small text on white', () => {
    expect(contrast(brand.sky, WHITE)).toBeLessThan(AA_TEXT)
  })

  it('declares the same handover colour in the stylesheet as in helpers/heroSky', () => {
    const css = readFileSync(
      join(process.cwd(), 'app/assets/css/components/brand.css'),
      'utf8',
    )
    expect(css.toUpperCase()).toContain(`--SKY-HANDOVER: ${SKY_HANDOVER}`)
  })

  it('gives the loading bar the colour and edge measured above', () => {
    const css = readFileSync(
      join(process.cwd(), 'app/assets/css/components/loading-indicator.css'),
      'utf8',
    )
    expect(css).toContain("background: theme('colors.primary.400') !important;")
    expect(css).toContain(
      "box-shadow: 0 1px 0 theme('colors.white') !important;",
    )
  })

  it('gives the skip link the white ring and navy rim measured above', () => {
    const css = readFileSync(
      join(process.cwd(), 'app/assets/css/components/brand.css'),
      'utf8',
    )
    const rule = /\.skip-link:focus-visible \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toContain('outline-color: theme(colors.white);')
    expect(rule).toMatch(/box-shadow:[^;]*theme\(colors\.brand\.navy\);/)
  })
})
