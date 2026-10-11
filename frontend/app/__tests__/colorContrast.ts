// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config, { brand, colors } from '../../tailwind.config'
import { HERO_GLOW, blendHeroGlowOver } from '../helpers/heroGlow'
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
  // Navigation loading bar (blue) over the event strip, header and menus.
  ['loading bar on white', LOADING_BAR, WHITE, AA_NON_TEXT],
  ['loading bar on tint', LOADING_BAR, brand.tint, AA_NON_TEXT],
  ['loading bar on gray-50', LOADING_BAR, colors.gray[50], AA_NON_TEXT],
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
  // The top of the first block can sit on the hero's handover colour, the
  // darkest background the page content reaches.
  ['body text on the sky handover', colors.gray[900], SKY_HANDOVER, AA_TEXT],
  ['navy heading on the sky handover', brand.navy, SKY_HANDOVER, AA_TEXT],
  [
    'blue label and link on the sky handover',
    brand.blue,
    SKY_HANDOVER,
    AA_TEXT,
  ],
  [
    'gray-600 caption on the sky handover',
    colors.gray[600],
    SKY_HANDOVER,
    AA_TEXT,
  ],
  [
    'navy focus outline on the sky handover',
    brand.navy,
    SKY_HANDOVER,
    AA_NON_TEXT,
  ],
  ['table border on the sky handover', TABLE_BORDER, SKY_HANDOVER, AA_NON_TEXT],
  // Rich text in the Text paragraph's coloured backgrounds, at both ends of
  // each gradient. Theme card: ice to lilac.
  ['navy link on the theme card, ice end', brand.navy, brand.ice, AA_TEXT],
  ['navy link on the theme card, lilac end', brand.navy, brand.lilac, AA_TEXT],
  // Navy band: navy to blue.
  ['ice body highlight on the navy band', brand.ice, brand.navy, AA_TEXT],
  ['ice body highlight at its blue end', brand.ice, brand.blue, AA_TEXT],
  ['white table focus ring on the navy band', WHITE, brand.navy, AA_NON_TEXT],
  ['white table focus ring at its blue end', WHITE, brand.blue, AA_NON_TEXT],
  // A table's white panel on a dark section.
  ['navy table text on its white panel', brand.navy, WHITE, AA_TEXT],
  ['link in a table on its white panel', colors.link.DEFAULT, WHITE, AA_TEXT],
  [
    'link hover in a table on its white panel',
    colors.link.hover,
    WHITE,
    AA_TEXT,
  ],
  [
    'blue highlight in a table on its white panel',
    colors.primary[400],
    WHITE,
    AA_TEXT,
  ],
  // Inner-page hero. The glow is painted behind the text, so text sits on the
  // gradient blended with the glow: the title anywhere, the ice lead and
  // breadcrumb only over the navy part (see the rejected pair below).
  ['ice lead text on blue', brand.ice, brand.blue, AA_TEXT],
  [
    'white title on glow over navy',
    WHITE,
    blendHeroGlowOver(brand.navy),
    AA_LARGE_TEXT,
  ],
  [
    'white title on glow over blue',
    WHITE,
    blendHeroGlowOver(brand.blue),
    AA_LARGE_TEXT,
  ],
  [
    'ice lead text on glow over navy',
    brand.ice,
    blendHeroGlowOver(brand.navy),
    AA_TEXT,
  ],
]

describe('brand colour contrast', () => {
  it.each(pairs)('%s meets WCAG AA', (_label, foreground, background, min) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min)
  })

  it('rejects sky as small text on white', () => {
    expect(contrast(brand.sky, WHITE)).toBeLessThan(AA_TEXT)
  })

  // The lead must stay clear of the glow's centre near the gradient's blue
  // end; PageHero keeps the glow on the title row for that reason.
  it('rejects ice lead text on the glow over blue', () => {
    expect(contrast(brand.ice, blendHeroGlowOver(brand.blue))).toBeLessThan(
      AA_TEXT,
    )
  })

  it('uses the tested handover colour in the stylesheet', () => {
    const css = readFileSync(
      join(process.cwd(), 'app/assets/css/components/brand.css'),
      'utf8',
    )
    expect(css.toUpperCase()).toContain(`--SKY-HANDOVER: ${SKY_HANDOVER}`)
  })

  it('draws the hero glow in brand sky', () => {
    expect(HERO_GLOW.color).toBe(brand.sky)
  })
})

describe('rich text on coloured backgrounds', () => {
  const read = (name: string) =>
    readFileSync(
      join(process.cwd(), 'app/assets/css/components', name),
      'utf8',
    ).replace(/\s+/g, ' ')
  const CK_CONTENT_CSS = read('ck-content.css')
  const BRAND_CSS = read('brand.css')

  it('rejects the link colour on the lilac end of the theme card', () => {
    expect(contrast(colors.link.DEFAULT, brand.lilac)).toBeLessThan(AA_TEXT)
  })

  it('sets theme card links in navy', () => {
    expect(CK_CONTENT_CSS).toContain(
      '.is-theme & a:not(.button) { @apply text-primary-500; }',
    )
  })

  it('rejects sky as body text on the blue end of the navy band', () => {
    expect(contrast(brand.sky, brand.blue)).toBeLessThan(AA_TEXT)
  })

  it('sets body highlights in the navy band in ice, heading ones in sky', () => {
    expect(BRAND_CSS).toContain(
      '.navy-band .ck-content .highlight { @apply text-primary-100; }',
    )
    expect(BRAND_CSS).toContain(
      '.navy-band .ck-content :is(h2, h3) .highlight { @apply text-primary-300; }',
    )
  })

  it('gives a table on a dark section light-section text colours', () => {
    expect(CK_CONTENT_CSS).toContain(
      "figure.table, & > table, & > [data-scrollable-table='wrapper'] { @apply text-primary-500; a:not(.button) { @apply text-link hover:text-link-hover; } .highlight { @apply text-primary-400; } }",
    )
  })

  it('draws the table focus ring in white on dark sections', () => {
    expect(CK_CONTENT_CSS).toContain(
      '[data-scrollable-table]:focus-visible { @apply outline-white; }',
    )
  })
})
