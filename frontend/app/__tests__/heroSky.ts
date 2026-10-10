// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { brand } from '../../tailwind.config'
import {
  RIDGE_DEEPEST_VALLEY,
  RIDGE_OUTLINE,
  RIDGE_SIZE,
} from '../helpers/ridge'
import {
  HOME_VALLEY_RATIO,
  SKY_HANDOVER_FROM,
  SKY_LEAD_END,
  SKY_REACHED_AT,
  SKY_TEXT_MAX_OPACITY,
  heroSkyGradient,
  homeHorizonGradient,
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

  it('is one oklch gradient from clear blue to the handover colour', () => {
    expect(gradient.startsWith('linear-gradient(to bottom in oklch, ')).toBe(
      true,
    )
    expect(gradient).toContain('var(--sky-from) 0.0%, transparent) 0.00%')
    expect(gradient).toContain('var(--sky-mid)')
    expect(gradient.endsWith(' 100.00%)')).toBe(true)
    expect(gradient).toContain('color-mix(in oklch, var(--sky-to) 100.0%, ')
  })

  it('lists its stops in rising order with one at the end of the lead', () => {
    const stops = stopPositions(gradient, / (\d+\.\d\d)%(?:,|\)$)/g)

    expect(stops.length).toBeGreaterThan(20)
    expect([...stops].sort((a, b) => a - b)).toEqual(stops)
    expect(stops).toContain(Number((SKY_LEAD_END * 100).toFixed(2)))
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

  // What the text can have behind it: navy behind the badge and title, up to
  // full blue behind the lead and buttons, and sky only below them, where the
  // buttons' white focus ring ends.
  it.each([
    ['sky year on navy', brand.sky, brand.navy, AA_TEXT],
    ['ice badge on navy', brand.ice, brand.navy, AA_TEXT],
    ['white lead and button label on blue', WHITE, brand.blue, AA_TEXT],
    [
      'white button border and focus ring on blue',
      WHITE,
      brand.blue,
      AA_NON_TEXT,
    ],
    ['white focus ring on sky', WHITE, brand.sky, AA_NON_TEXT],
  ])('%s meets WCAG AA', (_label, foreground, background, min) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(min)
  })

  it('rejects the text colours on what the layers keep away from them', () => {
    expect(contrast(brand.sky, brand.blue)).toBeLessThan(AA_TEXT)
    expect(contrast(WHITE, brand.sky)).toBeLessThan(AA_TEXT)
  })

  it('reaches plain sky at the deepest valley of the ridge', () => {
    const ys = [...RIDGE_OUTLINE.matchAll(/[ML](-?\d+) (\d+)/g)]
      .map((m) => [Number(m[1]), Number(m[2])] as const)
      .filter(
        ([x, y]) => x >= 0 && x <= RIDGE_SIZE.width && y <= RIDGE_SIZE.height,
      )
      .map(([, y]) => y)

    expect(Math.max(...ys)).toBe(RIDGE_DEEPEST_VALLEY)
    expect(HOME_VALLEY_RATIO).toBeCloseTo(
      (RIDGE_SIZE.height - RIDGE_DEEPEST_VALLEY) / RIDGE_SIZE.width,
      6,
    )
  })
})
