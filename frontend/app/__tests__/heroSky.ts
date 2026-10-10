// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { brand, colors } from '../../tailwind.config'
import {
  RIDGE_DEEPEST_VALLEY,
  RIDGE_OUTLINE,
  RIDGE_SIZE,
} from '../helpers/ridge'
import {
  SKY_HANDOVER_FROM,
  SKY_LEAD_END,
  SKY_REACHED_AT,
  SKY_TEXT_MAX_OPACITY,
  heroSkyFallbackGradient,
  heroSkyGradient,
  heroSkyProperties,
  homeHorizonFallbackGradient,
  homeHorizonGradient,
  homeRiseFallbackGradient,
  homeRiseGradient,
  horizonBlueOpacity,
  horizonSkyShare,
  skyBlueOpacity,
  skyHandoverShare,
  skySkyShare,
} from '../helpers/heroSky'

const STEP = 1 / 2000
const positions = Array.from({ length: 2001 }, (_, i) => i * STEP)
type Curve = (x: number) => number
const slope = (f: Curve, x: number, step = STEP) =>
  (f(x + step) - f(x - step)) / (2 * step)
const maxSlopeChange = (f: Curve, step: number) =>
  Math.max(
    ...positions
      .slice(4, -4)
      .map((x) =>
        Math.abs(slope(f, x + step, step) - slope(f, x - step, step)),
      ),
  )
// A jump in slope is what the eye reads as a line across the hero. On a smooth
// curve the slope changes half as much over half the distance; across a kink
// it changes by the same amount however close the two points are.
const KINK_RATIO = 0.6
const hasNoKink = (f: Curve) =>
  maxSlopeChange(f, STEP / 2) < KINK_RATIO * maxSlopeChange(f, STEP)

const AA_TEXT = 4.5
const AA_NON_TEXT = 3
const WHITE = '#FFFFFF'

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (light! + 0.05) / (dark! + 0.05)
}

const stopPositions = (gradient: string, unit: RegExp) =>
  [...gradient.matchAll(unit)].map((m) => Number(m[1]))

describe('kink check', () => {
  it('catches a curve made of two straight pieces', () => {
    expect(hasNoKink((x) => Math.max(0, x - 0.5013))).toBe(false)
  })
})

describe('shared horizon eases', () => {
  it.each([
    ['blue opacity', horizonBlueOpacity],
    ['sky share', horizonSkyShare],
  ])('%s runs from 0 to 1, only upwards, without a kink', (_name, ease) => {
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(-1)).toBe(0)
    expect(ease(2)).toBe(1)
    for (let i = 1; i < positions.length; i++) {
      expect(ease(positions[i]!)).toBeGreaterThanOrEqual(
        ease(positions[i - 1]!),
      )
    }
    expect(hasNoKink(ease)).toBe(true)
  })

  it('starts the sky without slope, so it can begin right under the text', () => {
    expect(Math.abs(slope(horizonSkyShare, STEP))).toBeLessThan(0.01)
  })
})

describe('inner-page sky curve', () => {
  it('starts clear and ends as the opaque handover colour', () => {
    expect(skyBlueOpacity(0)).toBe(0)
    expect(skySkyShare(0)).toBe(0)
    expect(skyHandoverShare(0)).toBe(0)
    expect(skyBlueOpacity(1)).toBe(1)
    expect(skySkyShare(1)).toBe(1)
    expect(skyHandoverShare(1)).toBe(1)
  })

  it('keeps the blue behind the text at or below its limit, with no sky', () => {
    expect(skyBlueOpacity(SKY_LEAD_END)).toBeCloseTo(SKY_TEXT_MAX_OPACITY, 4)
    positions
      .filter((position) => position <= SKY_LEAD_END)
      .forEach((position) => {
        expect(skyBlueOpacity(position)).toBeLessThanOrEqual(
          SKY_TEXT_MAX_OPACITY + 1e-6,
        )
        expect(skySkyShare(position)).toBe(0)
        expect(skyHandoverShare(position)).toBe(0)
      })
  })

  it('only ever gets lighter on the way down', () => {
    for (let i = 1; i < positions.length; i++) {
      for (const curve of [skyBlueOpacity, skySkyShare, skyHandoverShare]) {
        expect(curve(positions[i]!)).toBeGreaterThanOrEqual(
          curve(positions[i - 1]!),
        )
      }
    }
  })

  it('has no jump in slope anywhere, including where the lead ends', () => {
    expect(hasNoKink(skyBlueOpacity)).toBe(true)
    expect(hasNoKink(skySkyShare)).toBe(true)
    expect(hasNoKink(skyHandoverShare)).toBe(true)
    expect(Math.abs(slope(skySkyShare, SKY_LEAD_END))).toBeLessThan(0.01)
  })

  it('starts the handover before the sky is complete, so no band of plain sky rests between them', () => {
    expect(SKY_HANDOVER_FROM).toBeLessThan(SKY_REACHED_AT)
  })
})

describe('heroSkyGradient', () => {
  const gradient = heroSkyGradient()
  const stops = [
    ...gradient.matchAll(
      /calc\(var\(--page-hero-sky-height\) \* (\d\.\d{4})\)/g,
    ),
  ].map((m) => Number(m[1]))

  it('is one oklch gradient from the handover colour up to clear blue', () => {
    expect(gradient.startsWith('linear-gradient(to top in oklch, ')).toBe(true)
    expect(
      gradient.startsWith(
        'linear-gradient(to top in oklch, color-mix(in oklch, var(--sky-to) 100.0%, ',
      ),
    ).toBe(true)
    expect(gradient).toContain('var(--sky-mid)')
    expect(
      gradient.endsWith(
        'var(--sky-from) 0.0%, transparent) calc(var(--page-hero-sky-height) * 1.0000))',
      ),
    ).toBe(true)
  })

  // A sized, bottom-anchored tile taller than a hero of fractional height
  // stops short of the last pixel row and lets the navy show as a line.
  it('measures every stop up from the bottom edge instead of sizing a tile', () => {
    expect(gradient).not.toMatch(/\d\.\d\d%/)
    expect(stops.length).toBeGreaterThan(20)
    expect(stops[0]).toBe(0)
  })

  it('lists its stops in rising order with one at the end of the lead', () => {
    expect([...stops].sort((a, b) => a - b)).toEqual(stops)
    expect(stops).toContain(Number((1 - SKY_LEAD_END).toFixed(4)))
  })
})

describe('homepage horizon', () => {
  const rise = homeRiseGradient()
  const horizon = homeHorizonGradient()
  const LENGTH = /\* (\d\.\d{4})\)(?:,|\)$)/g

  it('rises from clear to full blue over --home-hero-rise', () => {
    expect(rise).toContain(
      'color-mix(in oklch, var(--sky-from) 0.0%, transparent) calc(var(--home-hero-rise) * 0.0000)',
    )
    expect(
      rise.endsWith(
        'color-mix(in oklch, var(--sky-from) 100.0%, transparent) calc(var(--home-hero-rise) * 1.0000))',
      ),
    ).toBe(true)
    expect(rise).not.toContain('--sky-mid')
  })

  // The horizon layer starts below the buttons (HomeHero's
  // --home-hero-horizon), so above it the text has blue at most.
  it('has no sky at the top of the zone below the text and plain sky at the valley', () => {
    expect(horizon).toContain(
      'color-mix(in oklch, var(--sky-mid) 0.0%, transparent) calc((var(--home-hero-horizon) - var(--home-hero-valley)) * 0.0000)',
    )
    expect(
      horizon.endsWith(
        'color-mix(in oklch, var(--sky-mid) 100.0%, transparent) calc((var(--home-hero-horizon) - var(--home-hero-valley)) * 1.0000))',
      ),
    ).toBe(true)
    expect(horizon).not.toContain('--sky-from')
  })

  it.each([
    ['rise', rise],
    ['horizon', horizon],
  ])('lists the %s stops in rising order', (_name, gradient) => {
    const stops = stopPositions(gradient, LENGTH)

    expect(stops.length).toBeGreaterThan(20)
    expect([...stops].sort((a, b) => a - b)).toEqual(stops)
  })

  it('reaches plain sky at the deepest valley of the ridge', () => {
    const ys = [...RIDGE_OUTLINE.matchAll(/[ML](-?\d+) (\d+)/g)]
      .map((m) => [Number(m[1]), Number(m[2])] as const)
      .filter(
        ([x, y]) => x >= 0 && x <= RIDGE_SIZE.width && y <= RIDGE_SIZE.height,
      )
      .map(([, y]) => y)

    expect(Math.max(...ys)).toBe(RIDGE_DEEPEST_VALLEY)
    // 109 of the drawing's 1920 units above its bottom edge.
    expect(PROPERTIES['.home-hero']['--home-hero-valley']).toBe('5.68vw')
  })
})

const COLOURS = { from: brand.blue, mid: brand.sky }
const PROPERTIES = heroSkyProperties(COLOURS)
const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const BRAND_CSS = read('app/assets/css/components/brand.css')
const CK_CONTENT_CSS = read('app/assets/css/components/ck-content.css')
const PAGE_HERO = read('app/components/PageHero/index.vue')
const HOME_HERO = read('app/components/HomeHero/index.vue')
const TAILWIND_CONFIG = read('tailwind.config.ts')
const STYLES = [BRAND_CSS, PAGE_HERO].join('\n')

describe('fallback gradients without oklch', () => {
  it.each([
    ['inner page', heroSkyFallbackGradient(COLOURS)],
    ['homepage rise', homeRiseFallbackGradient(COLOURS)],
    ['homepage horizon', homeHorizonFallbackGradient(COLOURS)],
  ])('%s uses only syntax old browsers know', (_name, gradient) => {
    expect(gradient).not.toContain('oklch')
    expect(gradient).not.toContain('color-mix')
    expect(gradient).not.toContain('rgb')
    expect(gradient).toMatch(/^linear-gradient\(to (top|bottom), /)
  })

  it('inner page: handover colour at the edge, blue at its limit where the lead ends, clear at the top', () => {
    const gradient = heroSkyFallbackGradient(COLOURS)

    expect(gradient).toContain(
      'linear-gradient(to top, var(--sky-to) calc(var(--page-hero-sky-height) * 0.0000), #009CDE ',
    )
    expect(gradient).toContain(
      `#006AA9B3 calc(var(--page-hero-sky-height) * ${(1 - SKY_LEAD_END).toFixed(4)})`,
    )
    expect(
      gradient.endsWith(
        '#006AA900 calc(var(--page-hero-sky-height) * 1.0000))',
      ),
    ).toBe(true)
  })

  it('homepage: the same ends as the oklch layers', () => {
    const rise = homeRiseFallbackGradient(COLOURS)
    const horizon = homeHorizonFallbackGradient(COLOURS)

    expect(rise).toContain('#006AA900 calc(var(--home-hero-rise) * 0.0000)')
    expect(
      rise.endsWith('#006AA9FF calc(var(--home-hero-rise) * 1.0000))'),
    ).toBe(true)
    expect(horizon).toContain('#009CDE00 calc(')
    expect(
      horizon.endsWith(
        '#009CDEFF calc((var(--home-hero-horizon) - var(--home-hero-valley)) * 1.0000))',
      ),
    ).toBe(true)
  })
})

describe('custom properties between tailwind.config and the stylesheets', () => {
  const emitted = Object.values(PROPERTIES).flatMap((block) =>
    Object.keys(block),
  )
  const values = Object.values(PROPERTIES)
    .flatMap((block) => Object.values(block))
    .join(' ')
  const referenced = [...new Set(values.match(/var\((--[a-z-]+)\)/g))].map(
    (reference) => reference.slice(4, -1),
  )

  it('writes them through the plugin', () => {
    expect(TAILWIND_CONFIG).toMatch(
      /addComponents\(heroSkyProperties\(\{ from: brand\.blue, mid: brand\.sky \}\)\)/,
    )
  })

  it.each(emitted)('%s is read by a stylesheet or a gradient', (name) => {
    expect(`${STYLES} ${values}`).toContain(`var(${name})`)
  })

  it.each(referenced)('%s, used inside a gradient, is declared', (name) => {
    expect(emitted.includes(name) || STYLES.includes(`${name}:`)).toBe(true)
  })

  it("declares each hero's properties on the class the stylesheets style", () => {
    expect(Object.keys(PROPERTIES)).toEqual(['.page-hero', '.home-hero'])
    expect(PAGE_HERO).toContain('.page-hero {')
    expect(BRAND_CSS).toContain('.home-hero {')
    expect(HOME_HERO).toMatch(/class="[^"]*\bhome-hero\b/)
  })

  it('uses the oklch gradients only where they are supported', () => {
    const supports =
      /@supports \(background: linear-gradient\(in oklch, #000, #fff\)\) \{([\s\S]*?)\n {0,2}\}\n/g
    const guarded = [...STYLES.matchAll(supports)].map((m) => m[1]).join('\n')
    const unguarded = STYLES.replace(supports, '')

    for (const name of [
      '--page-hero-sky',
      '--home-hero-rise-sky',
      '--home-hero-horizon-sky',
    ]) {
      expect(guarded).toContain(`var(${name})`)
      expect(unguarded).not.toContain(`var(${name})`)
      expect(unguarded).toContain(`var(${name}-fallback)`)
    }
  })
})

// The colour a rule or element really gets, read from the source, so a change
// to the stylesheet or the template fails here.
const TEXT_COLOURS: Record<string, string> = {
  'text-white': WHITE,
  'text-primary-100': colors.primary[100],
  'text-primary-300': colors.primary[300],
  'text-primary-400': colors.primary[400],
  'text-primary-500': colors.primary[500],
}

function textColourAfter(source: string, anchor: string): string {
  const from = source.indexOf(anchor)
  expect(from, `"${anchor}" not found`).toBeGreaterThanOrEqual(0)
  const match = source
    .slice(from + anchor.length)
    .match(/\btext-(?:white|primary-\d+)\b/)
  expect(match, `no text colour after "${anchor}"`).not.toBeNull()
  return TEXT_COLOURS[match![0]]!
}

function themeColour(source: string, anchor: string): string {
  const from = source.indexOf(anchor)
  expect(from, `"${anchor}" not found`).toBeGreaterThanOrEqual(0)
  const match = source.slice(from).match(/theme\(colors\.brand\.(\w+)\)/)
  expect(match, `no brand colour after "${anchor}"`).not.toBeNull()
  return brand[match![1] as keyof typeof brand]
}

describe('homepage hero text on what the layers put behind it', () => {
  const heroBase = themeColour(
    BRAND_CSS,
    '    background: linear-gradient(\n        theme(colors.brand.navy)',
  )
  const riseColour = themeColour(BRAND_CSS, '  .home-hero {\n    --sky-from:')
  const skyColour = themeColour(BRAND_CSS, '    --sky-mid:')
  const year = textColourAfter(HOME_HERO, 'v-if="titleParts.year"')
  const badgeLabel = textColourAfter(
    BRAND_CSS,
    '  .label {\n    @apply text-sm font-bold uppercase tracking-[0.08em] text-primary-400;\n\n    .on-dark & {',
  )
  const highlight = textColourAfter(
    BRAND_CSS,
    '.on-dark .ck-content.home-hero-lead .highlight',
  )
  const leadLink = textColourAfter(CK_CONTENT_CSS, '      a:not(.button) {')
  const outlineButton = textColourAfter(
    CK_CONTENT_CSS,
    '      a.button.is-outline {',
  )

  it('reads the colours the hero really uses', () => {
    expect(heroBase).toBe(brand.navy)
    expect(riseColour).toBe(brand.blue)
    expect(skyColour).toBe(brand.sky)
    expect(HOME_HERO).toMatch(/class="on-dark home-hero\b/)
  })

  // Navy behind the badge and title; up to full blue behind the lead and
  // buttons; sky only below them, where the buttons' focus ring ends.
  it.each([
    ['year in the title on the hero base', year, heroBase, AA_TEXT],
    ['badge label on the hero base', badgeLabel, heroBase, AA_TEXT],
    ['lead text on the full rise', WHITE, riseColour, AA_TEXT],
    ['highlight in the lead on the full rise', highlight, riseColour, AA_TEXT],
    ['highlight in the lead on the hero base', highlight, heroBase, AA_TEXT],
    ['link in the lead on the full rise', leadLink, riseColour, AA_TEXT],
    [
      'outline button label on the full rise',
      outlineButton,
      riseColour,
      AA_TEXT,
    ],
    [
      'outline button border on the full rise',
      outlineButton,
      riseColour,
      AA_NON_TEXT,
    ],
    ['focus ring on the sky', WHITE, skyColour, AA_NON_TEXT],
  ])('%s meets WCAG AA', (_label, foreground, background, min) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min)
  })

  it('draws the focus ring on dark sections in white', () => {
    expect(BRAND_CSS).toMatch(
      /\.on-dark :focus-visible \{\s*outline-color: theme\(colors\.white\);/,
    )
  })

  it('rejects the text colours on what the layers keep away from them', () => {
    expect(contrast(year, riseColour)).toBeLessThan(AA_TEXT)
    expect(contrast(WHITE, skyColour)).toBeLessThan(AA_TEXT)
  })

  it('keeps the sky clear of the buttons by their focus ring', () => {
    expect(BRAND_CSS).toMatch(
      /--home-hero-clearance: calc\(\s*var\(--focus-ring-width\) \+ var\(--focus-ring-offset\) \+\s*var\(--home-hero-scrollbar-slack\)\s*\);/,
    )
    expect(BRAND_CSS).toMatch(/outline: var\(--focus-ring-width\) solid/)
    expect(BRAND_CSS).toMatch(/outline-offset: var\(--focus-ring-offset\);/)
  })
})

describe('hero bottom edge at fractional device pixel ratios', () => {
  it('ends the dark base above the edge and backs the edge row with the next colour', () => {
    expect(PAGE_HERO).toMatch(
      /\.brand-hero\.page-hero \{\s*background: var\(--brand-hero-gradient\) top \/ 100%\s*calc\(100% - var\(--page-hero-edge\)\) no-repeat var\(--sky-handover\);\s*box-shadow: 0 var\(--page-hero-backdrop\) 0 var\(--page-hero-edge-colour\);/,
    )
    expect(PAGE_HERO).toContain('--page-hero-edge-colour: var(--sky-handover);')
    expect(BRAND_CSS).toMatch(
      /top \/ 100% calc\(100% - var\(--home-hero-edge\)\) no-repeat\s*theme\(colors\.brand\.ice\);\s*box-shadow: 0 var\(--home-hero-backdrop\) 0 theme\(colors\.brand\.ice\);/,
    )
  })

  it('backs a hero that meets a dark band with navy', () => {
    expect(PAGE_HERO).toMatch(
      /:is\(\.navy-band, \.week-band\):first-child\s*\) \{\s*--page-hero-fade: 0px;\s*--page-hero-edge-colour: theme\(colors\.brand\.navy\);/,
    )
  })
})
