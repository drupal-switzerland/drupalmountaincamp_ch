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

  it('is one oklch gradient from clear blue to the handover colour', () => {
    expect(gradient.startsWith('linear-gradient(to bottom in oklch, ')).toBe(
      true,
    )
    expect(gradient).toContain('var(--sky-from) 0.0%, transparent) 0.00%')
    expect(
      gradient.endsWith(
        'color-mix(in oklch, var(--sky-to) 100.0%, var(--sky-from)) 100.00%)',
      ),
    ).toBe(true)
  })

  it('lists its stops in rising order with one at the end of the lead', () => {
    const stops = [...gradient.matchAll(/ (\d+\.\d\d)%(?:,|\)$)/g)].map((m) =>
      Number(m[1]),
    )

    expect(stops.length).toBeGreaterThan(20)
    expect([...stops].sort((a, b) => a - b)).toEqual(stops)
    expect(stops).toContain(Number((SKY_LEAD_END * 100).toFixed(2)))
  })
})
