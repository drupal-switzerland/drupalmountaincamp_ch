import { RIDGE_DEEPEST_VALLEY, RIDGE_SIZE } from '../ridge'

/**
 * The colour the inner-page hero hands over to the page at its bottom edge:
 * brand ice with 3% brand sky (mixed in oklch). It is the deepest blue on
 * which brand-blue labels and links still reach 4.5:1 (checked in
 * colorContrast), so the first block can start right below the hero. Declared
 * as --sky-handover in brand.css.
 */
export const SKY_HANDOVER = '#C7EBF8'

/**
 * The inner-page hero's sky is one gradient, anchored to the hero's bottom
 * edge. Its lower part is the zone below the lead; it reaches up behind the
 * text by this share of that zone.
 */
export const SKY_RISE_RATIO = 1.25

/** Blue behind the inner-page text is never more opaque than this: the ice lead needs a darker background than full blue. */
export const SKY_TEXT_MAX_OPACITY = 0.7

/** Below the text, the share of the way down at which the blue has become sky. */
export const SKY_REACHED_AT = 0.6

/** Below the text, the share of the way down at which sky starts turning into the handover colour. */
export const SKY_HANDOVER_FROM = 0.3

// A gradient is straight between stops; this many keep the corners at the
// stops below what shows on the steepest part of a curve.
const STOP_COUNT = 64

/** Where the lead ends on the inner-page curve (0 = top of the gradient, 1 = hero edge). */
export const SKY_LEAD_END = SKY_RISE_RATIO / (1 + SKY_RISE_RATIO)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smoothstep = (x: number) => x * x * (3 - 2 * x)
const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/**
 * The horizon both heroes share, in two eases. Navy turns blue: how opaque
 * the blue is over a rise from 0 to 1.
 */
export function horizonBlueOpacity(progress: number): number {
  return smoothstep(clamp01(progress))
}

/**
 * Then blue turns sky: the share of sky over a stretch from 0 to 1. It starts
 * and ends without slope, so it can begin right under the text unnoticed.
 */
export function horizonSkyShare(progress: number): number {
  return smootherstep(clamp01(progress))
}

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

const belowLead = (position: number) =>
  (position - SKY_LEAD_END) / (1 - SKY_LEAD_END)

/** Inner pages: how opaque the blue is; at its limit where the lead ends, opaque about 70% of the way from there to the edge. */
export function skyBlueOpacity(position: number): number {
  return horizonBlueOpacity(position / OPAQUE_AT)
}

/** Inner pages: how far the blue has turned sky. Nothing down to the end of the lead. */
export function skySkyShare(position: number): number {
  return horizonSkyShare(belowLead(position) / SKY_REACHED_AT)
}

/**
 * Inner pages only: how far the sky has turned into the handover colour. It
 * starts before the sky is complete, so the two eases run into each other
 * instead of resting on a band of plain sky.
 */
export function skyHandoverShare(position: number): number {
  return horizonSkyShare(
    (belowLead(position) - SKY_HANDOVER_FROM) / (1 - SKY_HANDOVER_FROM),
  )
}

const percent = (value: number, digits: number) =>
  `${(value * 100).toFixed(digits)}%`

const evenly = (count: number) =>
  Array.from({ length: count + 1 }, (_, i) => i / count)

const mix = (colour: string, share: number, into: string) =>
  `color-mix(in oklch, ${colour} ${percent(share, 1)}, ${into})`

// Stops are lengths measured up from the hero's bottom edge, not shares of a
// sized background tile: a tile taller than a hero of fractional height is
// snapped short of the last pixel row, which then shows the navy underneath.
const fromBottom = (position: number) =>
  `calc(var(--page-hero-sky-height) * ${(1 - position).toFixed(4)})`

function skyStop(position: number): string {
  const opacity = skyBlueOpacity(position)
  const sky = skySkyShare(position)
  const handover = skyHandoverShare(position)
  const blue =
    sky > 0 ? mix('var(--sky-mid)', sky, 'var(--sky-from)') : 'var(--sky-from)'
  const colour = handover > 0 ? mix('var(--sky-to)', handover, blue) : blue
  const at = fromBottom(position)
  return opacity < 1
    ? `${mix(colour, opacity, 'transparent')} ${at}`
    : `${colour} ${at}`
}

/**
 * Background image for the inner-page hero's sky, written into the stylesheet
 * by tailwind.config. It fills the hero from the bottom edge up over
 * --page-hero-sky-height and is clear above that. PageHero sets --sky-from
 * (brand blue), --sky-mid (brand sky) and --sky-to (the handover colour) on
 * .page-hero; brand.css sets the first two on .home-hero. Mixed in oklch so
 * the midtones stay blue instead of grey.
 */
export function heroSkyGradient(): string {
  const stops = [...new Set([...evenly(STOP_COUNT), SKY_LEAD_END, OPAQUE_AT])]
    .filter((position) => position <= 1)
    .sort((a, b) => b - a)
    .map(skyStop)
  return `linear-gradient(to top in oklch, ${stops.join(', ')})`
}

const HOME_STOP_COUNT = STOP_COUNT / 2

/**
 * Homepage, first ease: clear to blue over --home-hero-rise, starting under
 * the title. Stops are lengths, so the blue simply continues below the rise
 * whatever the height of the lead.
 */
export function homeRiseGradient(): string {
  const stops = evenly(HOME_STOP_COUNT).map(
    (progress) =>
      `${mix('var(--sky-from)', horizonBlueOpacity(progress), 'transparent')} calc(var(--home-hero-rise) * ${progress.toFixed(4)})`,
  )
  return `linear-gradient(to bottom in oklch, ${stops.join(', ')})`
}

/**
 * Homepage, second ease: sky over the blue, from the top of the zone below
 * the text to the ridge's deepest valley, then plain sky behind the ridge.
 * Sky is laid over as a share of opacity so it needs no blue of its own under
 * it and leaves no edge where the rise is still under way.
 */
export function homeHorizonGradient(): string {
  const stops = evenly(HOME_STOP_COUNT).map(
    (progress) =>
      `${mix('var(--sky-mid)', horizonSkyShare(progress), 'transparent')} calc((var(--home-hero-horizon) - var(--home-hero-valley)) * ${progress.toFixed(4)})`,
  )
  return `linear-gradient(to bottom in oklch, ${stops.join(', ')})`
}

/** How far above the hero's bottom edge the ridge's deepest valley sits, as a share of the hero's width. */
export const HOME_VALLEY_RATIO =
  (RIDGE_SIZE.height - RIDGE_DEEPEST_VALLEY) / RIDGE_SIZE.width

/** Brand colours as hex, for the gradients browsers without oklch support get. */
export interface SkyColours {
  /** Brand blue. */
  from: string
  /** Brand sky. */
  mid: string
}

// Enough for a plain sRGB gradient; it only has to look like the horizon.
const FALLBACK_STOP_COUNT = 16

// Eight-digit hex: the stylesheet pipeline mangles rgba() next to calc().
function translucent(hex: string, opacity: number): string {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()
  return `${hex}${alpha}`
}

// Below the lead the two eases overlap; the fallback passes through plain sky
// half-way between where the handover starts and where the sky is complete.
const FALLBACK_SKY_AT =
  SKY_LEAD_END + (1 - SKY_LEAD_END) * ((SKY_HANDOVER_FROM + SKY_REACHED_AT) / 2)

/**
 * The inner-page sky without color-mix or oklch interpolation: the same rise
 * behind the text, then sky and the handover colour as plain stops.
 */
export function heroSkyFallbackGradient({ from, mid }: SkyColours): string {
  const rise = evenly(FALLBACK_STOP_COUNT)
    .map((share) => share * SKY_LEAD_END)
    .reverse()
    .map(
      (position) =>
        `${translucent(from, skyBlueOpacity(position))} ${fromBottom(position)}`,
    )
  const stops = [
    `var(--sky-to) ${fromBottom(1)}`,
    `${mid} ${fromBottom(FALLBACK_SKY_AT)}`,
    ...rise,
  ]
  return `linear-gradient(to top, ${stops.join(', ')})`
}

/** The homepage rise without color-mix or oklch interpolation. */
export function homeRiseFallbackGradient({ from }: SkyColours): string {
  const stops = evenly(FALLBACK_STOP_COUNT).map(
    (progress) =>
      `${translucent(from, horizonBlueOpacity(progress))} calc(var(--home-hero-rise) * ${progress.toFixed(4)})`,
  )
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}

/** The homepage sky layer without color-mix or oklch interpolation. */
export function homeHorizonFallbackGradient({ mid }: SkyColours): string {
  const stops = evenly(FALLBACK_STOP_COUNT).map(
    (progress) =>
      `${translucent(mid, horizonSkyShare(progress))} calc((var(--home-hero-horizon) - var(--home-hero-valley)) * ${progress.toFixed(4)})`,
  )
  return `linear-gradient(to bottom, ${stops.join(', ')})`
}

/**
 * The custom properties tailwind.config writes on the two heroes. They are
 * declared on the hero itself: the gradients refer to --sky-from, --sky-mid
 * and --sky-to, which resolve where they are declared.
 */
export function heroSkyProperties(colours: SkyColours) {
  return {
    '.page-hero': {
      '--page-hero-sky': heroSkyGradient(),
      '--page-hero-sky-fallback': heroSkyFallbackGradient(colours),
      '--page-hero-rise': String(SKY_RISE_RATIO),
    },
    '.home-hero': {
      '--home-hero-rise-sky': homeRiseGradient(),
      '--home-hero-rise-sky-fallback': homeRiseFallbackGradient(colours),
      '--home-hero-horizon-sky': homeHorizonGradient(),
      '--home-hero-horizon-sky-fallback': homeHorizonFallbackGradient(colours),
      '--home-hero-valley': `${(HOME_VALLEY_RATIO * 100).toFixed(2)}vw`,
    },
  }
}
