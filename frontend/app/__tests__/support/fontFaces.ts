export type FontFace = {
  family: string
  weight: number
  style: string
}

const DEFAULT_WEIGHT = '400'
const DEFAULT_STYLE = 'normal'
const LATIN_SAMPLE = 'A'.codePointAt(0)!
const FONT_EXTENSION = '.woff2'

type ParsedFace = {
  family: string
  weight: [number, number]
  style: string
  unicodeRange?: string
  url?: string
}

function declaration(block: string, property: string) {
  return new RegExp(`(?:^|[;{])\\s*${property}\\s*:\\s*([^;}]+)`, 'i')
    .exec(block)?.[1]
    ?.trim()
}

function parseWeight(value: string): [number, number] {
  const [min, max = min] = value.split(/\s+/).map(Number)
  return [min ?? NaN, max ?? NaN]
}

function parseFontFaces(css: string): ParsedFace[] {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(
    ([, block = '']) => ({
      family: (declaration(block, 'font-family') ?? '').replace(/["'\\]/g, ''),
      weight: parseWeight(declaration(block, 'font-weight') ?? DEFAULT_WEIGHT),
      style: declaration(block, 'font-style') ?? DEFAULT_STYLE,
      unicodeRange: declaration(block, 'unicode-range'),
      url: [...block.matchAll(/url\(["']?([^"')\s]+)/gi)]
        .map(([, url = '']) => url)
        .find((url) => url.endsWith(FONT_EXTENSION)),
    }),
  )
}

// "U+41", "U+0-FF" and the wildcard form "U+??" (which is U+00 to U+FF).
function rangeIncludes(unicodeRange: string, codePoint: number) {
  return unicodeRange.split(',').some((part) => {
    const [from = '', to = from] = part.trim().replace(/^U\+/i, '').split('-')
    const low = Number.parseInt(from.replaceAll('?', '0'), 16)
    const high = Number.parseInt(to.replaceAll('?', 'F'), 16)
    return low <= codePoint && codePoint <= high
  })
}

function matches(face: ParsedFace, wanted: FontFace) {
  return (
    face.family === wanted.family &&
    face.style === wanted.style &&
    face.weight[0] <= wanted.weight &&
    wanted.weight <= face.weight[1] &&
    (!face.unicodeRange || rangeIncludes(face.unicodeRange, LATIN_SAMPLE))
  )
}

/**
 * Finds the latin woff2 file of each wanted face in generated @font-face CSS.
 * A face with no file, or with more than one candidate file, is reported as
 * missing instead of guessed: a wrong preload costs more than none.
 */
export function pickFontFiles(css: string, wanted: FontFace[]) {
  const faces = parseFontFaces(css)
  const urls: string[] = []
  const missing: FontFace[] = []
  for (const face of wanted) {
    const candidates = new Set(
      faces.filter((f) => f.url && matches(f, face)).map((f) => f.url!),
    )
    const [url] = candidates
    if (candidates.size === 1 && url) {
      urls.push(url)
    } else {
      missing.push(face)
    }
  }
  return { urls, missing }
}
