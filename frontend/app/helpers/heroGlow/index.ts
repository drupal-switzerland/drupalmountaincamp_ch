// Sky light behind the inner-page hero's plus marks. The peak stays low enough
// that white text over it keeps its contrast (checked in colorContrast).
export const HERO_GLOW = {
  /** Brand sky. */
  color: '#009CDE',
  peakOpacity: 0.45,
} as const

// [position, share of the peak]: eased so the light fades without a ring.
const FALLOFF: [number, number][] = [
  [0, 1],
  [0.15, 0.9],
  [0.35, 0.62],
  [0.55, 0.32],
  [0.75, 0.11],
  [0.9, 0.03],
  [1, 0],
]

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ]
}

/** Background image for the glow element: an ellipse filling its box. */
export function heroGlowGradient(): string {
  const [r, g, b] = hexToRgb(HERO_GLOW.color)
  const stops = FALLOFF.map(
    ([at, share]) =>
      `rgb(${r} ${g} ${b} / ${(HERO_GLOW.peakOpacity * share).toFixed(3)}) ${at * 100}%`,
  )
  return `radial-gradient(closest-side, ${stops.join(', ')})`
}

/** The colour the glow's peak gives a background, for contrast checks. */
export function blendHeroGlowOver(background: string): string {
  const glow = hexToRgb(HERO_GLOW.color)
  const base = hexToRgb(background)
  const mixed = glow.map((channel, i) =>
    Math.round(
      channel * HERO_GLOW.peakOpacity + base[i]! * (1 - HERO_GLOW.peakOpacity),
    ),
  )
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}
