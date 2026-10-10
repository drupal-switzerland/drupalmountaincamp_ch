// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  SKY_LEAD_END,
  SKY_TEXT_MAX_OPACITY,
  heroSkyGradient,
  skyBlueOpacity,
  skyHandoverShare,
} from '../helpers/heroSky'

const STEP = 1 / 2000
const positions = Array.from({ length: 2001 }, (_, i) => i * STEP)
const slope = (f: (x: number) => number, x: number) =>
  (f(x + STEP) - f(x - STEP)) / (2 * STEP)

describe('hero sky curve', () => {
  it('starts clear and ends as the opaque handover colour', () => {
    expect(skyBlueOpacity(0)).toBe(0)
    expect(skyHandoverShare(0)).toBe(0)
    expect(skyBlueOpacity(1)).toBe(1)
    expect(skyHandoverShare(1)).toBe(1)
  })

  it('keeps the blue behind the text at or below its limit', () => {
    expect(skyBlueOpacity(SKY_LEAD_END)).toBeCloseTo(SKY_TEXT_MAX_OPACITY, 4)
    positions
      .filter((position) => position <= SKY_LEAD_END)
      .forEach((position) => {
        expect(skyBlueOpacity(position)).toBeLessThanOrEqual(
          SKY_TEXT_MAX_OPACITY + 1e-6,
        )
        expect(skyHandoverShare(position)).toBe(0)
      })
  })

  it('only ever gets lighter on the way down', () => {
    for (let i = 1; i < positions.length; i++) {
      expect(skyBlueOpacity(positions[i]!)).toBeGreaterThanOrEqual(
        skyBlueOpacity(positions[i - 1]!),
      )
      expect(skyHandoverShare(positions[i]!)).toBeGreaterThanOrEqual(
        skyHandoverShare(positions[i - 1]!),
      )
    }
  })

  // A jump in slope is what the eye reads as a line across the hero.
  it('has no jump in slope anywhere, including where the lead ends', () => {
    const inner = positions.slice(2, -2)
    const maxSlopeChange = (f: (x: number) => number) =>
      Math.max(
        ...inner.map((x) => Math.abs(slope(f, x + STEP) - slope(f, x - STEP))),
      )

    // Both curves are smooth polynomials; their slope moves by a few
    // thousandths per step. A kink would show as a change of order 1.
    expect(maxSlopeChange(skyBlueOpacity)).toBeLessThan(0.05)
    expect(maxSlopeChange(skyHandoverShare)).toBeLessThan(0.05)
    expect(Math.abs(slope(skyHandoverShare, SKY_LEAD_END))).toBeLessThan(0.01)
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
    expect(gradient).toContain(
      'color-mix(in oklch, var(--sky-to) 100.0%, var(--sky-from)) calc(var(--page-hero-sky-height) * 0.0000)',
    )
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
