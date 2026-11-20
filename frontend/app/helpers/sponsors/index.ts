export const SPONSOR_YEAR = 2027
export const SPONSORSHIP_PATH = '/sponsorship'
export const PLATINUM_SPOTS = 3

export type LogoBox = {
  area: number
  maxWidth: number
  maxHeight: number
}

// Logos get the same visual area whatever their shape, capped to their tile
// (tile size minus the 2px border and 16px side padding).
export const LOGO_BOXES = {
  // Homepage card, 140px tall tiles in a 3-column grid.
  card: { area: 14000, maxWidth: 260, maxHeight: 100 },
  // Footer tiles: 280x100, 240x88, 200x72.
  large: { area: 11000, maxWidth: 248, maxHeight: 84 },
  medium: { area: 9000, maxWidth: 208, maxHeight: 72 },
  standard: { area: 7000, maxWidth: 168, maxHeight: 64 },
} satisfies Record<string, LogoBox>

export function logoSize(width: number, height: number, box: LogoBox) {
  const ratio = width / height
  let w = Math.sqrt(box.area * ratio)
  let h = w / ratio
  if (h > box.maxHeight) {
    h = box.maxHeight
    w = h * ratio
  }
  if (w > box.maxWidth) {
    w = box.maxWidth
    h = w / ratio
  }
  return { width: Math.round(w), height: Math.round(h) }
}

type Derivative = { urlPath?: string | null; width?: number | null }

/**
 * srcset of the usable derivatives, smallest first, so the browser fetches
 * the smallest one that covers the logo's rendered width on the screen's
 * pixel density. One entry per width.
 */
export function logoSrcset(
  derivatives: (Derivative | null | undefined)[],
  toPath: (url: string) => string = (url) => url,
): string {
  const byWidth = new Map<number, string>()
  for (const derivative of derivatives) {
    if (derivative?.urlPath && derivative.width) {
      byWidth.set(derivative.width, toPath(derivative.urlPath))
    }
  }
  return [...byWidth]
    .sort(([a], [b]) => a - b)
    .map(([width, path]) => `${path} ${width}w`)
    .join(', ')
}

export function groupByTier<T extends { tier?: string | null }>(
  items: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const item of items) {
    if (item.tier) {
      groups[item.tier] = [...(groups[item.tier] ?? []), item]
    }
  }
  return groups
}

/** Splits a heading around the first occurrence of a word to highlight. */
export function splitHighlight(text: string, word: string) {
  const index = word ? text.indexOf(word) : -1
  if (index < 0) {
    return null
  }
  return {
    before: text.slice(0, index),
    highlight: word,
    after: text.slice(index + word.length),
  }
}
