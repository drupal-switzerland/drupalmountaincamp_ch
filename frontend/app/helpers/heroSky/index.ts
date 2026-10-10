/**
 * The colour the inner-page hero hands over to the page at its bottom edge:
 * brand ice with 3% brand sky (mixed in oklch). It is the deepest blue on
 * which brand-blue labels and links still reach 4.5:1 (checked in
 * colorContrast), so the first block can start right below the hero. Declared
 * as --sky-handover in brand.css.
 */
export const SKY_HANDOVER = '#C7EBF8'

/**
 * The hero's sky is one gradient, anchored to the hero's bottom edge. Its
 * lower part is the zone below the lead; it reaches up behind the text by
 * this share of that zone.
 */
export const SKY_RISE_RATIO = 1.25

/** Blue behind the text is never more opaque than this, so the text keeps a dark background. */
export const SKY_TEXT_MAX_OPACITY = 0.7

// A gradient is straight between stops; this many keep the corners at the
// stops below what shows on the steepest part of the curve.
const STOP_COUNT = 64

/** Where the lead ends on the curve (0 = top of the gradient, 1 = hero edge). */
export const SKY_LEAD_END = SKY_RISE_RATIO / (1 + SKY_RISE_RATIO)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (x: number) => x * x * (3 - 2 * x)
const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

// smoothstep reaches SKY_TEXT_MAX_OPACITY at this input; found by bisection.
function inverseSmoothstep(target: number): number {
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (smoothstep(mid) < target) {
      low = mid
    } else {
      high = mid
    }
  }
  return (low + high) / 2
}

const OPAQUE_AT = SKY_LEAD_END / inverseSmoothstep(SKY_TEXT_MAX_OPACITY)

/**
 * How opaque the blue is at a point of the curve: one smoothstep from clear at
 * the top to opaque a little below the lead, so its slope never jumps.
 */
export function skyBlueOpacity(position: number): number {
  return smoothstep(clamp01(position / OPAQUE_AT))
}

/**
 * How far the blue has turned into the handover colour: nothing down to the
 * end of the lead, then a smootherstep, which starts and ends without slope.
 */
export function skyHandoverShare(position: number): number {
  return smootherstep(clamp01((position - SKY_LEAD_END) / (1 - SKY_LEAD_END)))
}

const percent = (value: number, digits: number) =>
  `${(value * 100).toFixed(digits)}%`

function skyStop(position: number): string {
  const opacity = skyBlueOpacity(position)
  const share = skyHandoverShare(position)
  const at = percent(position, 2)
  const colour =
    share > 0
      ? `color-mix(in oklch, var(--sky-to) ${percent(share, 1)}, var(--sky-from))`
      : 'var(--sky-from)'
  return opacity < 1
    ? `color-mix(in oklch, ${colour} ${percent(opacity, 1)}, transparent) ${at}`
    : `${colour} ${at}`
}

/**
 * Background image for the hero's sky, written into the stylesheet by
 * tailwind.config. --sky-from (brand blue) and --sky-to (the handover colour)
 * are set in PageHero's styles. Mixed in oklch so the midtones stay blue
 * instead of grey.
 */
export function heroSkyGradient(): string {
  const positions = Array.from(
    { length: STOP_COUNT + 1 },
    (_, i) => i / STOP_COUNT,
  )
  const stops = [...new Set([...positions, SKY_LEAD_END, OPAQUE_AT])]
    .filter((position) => position <= 1)
    .sort((a, b) => a - b)
    .map(skyStop)
  return `linear-gradient(to bottom in oklch, ${stops.join(', ')})`
}
