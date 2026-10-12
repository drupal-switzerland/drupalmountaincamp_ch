// @vitest-environment node
import { existsSync, globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { pickFontFiles } from './support/fontFaces'

const FRONTEND = resolve(import.meta.dirname, '../..')
const BUILT_ASSETS = resolve(FRONTEND, '.output/public/_nuxt')
const BUILT_MANIFEST = resolve(
  FRONTEND,
  '.output/server/chunks/virtual/precomputed.mjs',
)
// The same directory as the build assets, where the built CSS points from.
const ASSETS_URL = 'http://localhost/_nuxt/'
const STALE_BUILD =
  'The build in .output does not match the code. Run `bun run build` again.'

// What the preloaded files have to be: body font first, heading font second.
const PRELOADED_FACES = [
  { family: 'Source Sans 3', weight: 400, style: 'normal' },
  { family: 'ZT Gatha', weight: 700, style: 'normal' },
]
const STYLES = ['normal', 'italic']

const TYPOGRAPHY_CSS = readFileSync(
  resolve(FRONTEND, 'app/assets/css/typography.css'),
  'utf8',
)

type ManifestRecord = {
  file: string
  isEntry?: boolean
  assets?: string[]
  resourceType?: string
  mimeType?: string
  preload?: boolean
}
type Manifest = Record<string, ManifestRecord>

let headingFontPreload: string
let bodyFontPreload: RegExp
let headLinks: Record<string, string>[]
let markBodyFontPreload: (manifest: Manifest) => void

// nuxt.config.ts calls the defineNuxtConfig global, which only exists while
// Nuxt loads it.
beforeAll(async () => {
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
  const module = await import('../../nuxt.config')
  const config = module.default as unknown as {
    app: { head: { link: Record<string, string>[] } }
    hooks: { 'build:manifest': (manifest: Manifest) => void }
  }
  headingFontPreload = module.HEADING_FONT_PRELOAD
  bodyFontPreload = module.BODY_FONT_PRELOAD
  headLinks = config.app.head.link
  markBodyFontPreload = config.hooks['build:manifest']
  vi.unstubAllGlobals()
})

const fileName = (url: string) => url.split('/').pop() ?? ''

// The body font's rules of one style, in declaration order.
function bodyFontRules(css: string, style: string) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)]
    .map(([, block = '']) => block)
    .filter(
      (block) =>
        block.includes('Source Sans 3') &&
        new RegExp(`font-style:\\s*${style}`).test(block),
    )
}

function bodyFontSubsets(css: string, style: string) {
  return bodyFontRules(css, style).map(
    (block) => /source-sans-3-(latin(?:-ext)?)-wght/.exec(block)?.[1],
  )
}

function entryWithAssets(assets: string[]): Manifest {
  return {
    'entry.js': { file: 'entry.abc123.js', isEntry: true, assets },
    'page.js': { file: 'page.def456.js' },
  }
}

describe('font preloads', () => {
  it('have the heading font as a cross-origin woff2 preload in every page head', () => {
    expect(headLinks.filter((link) => link.as === 'font')).toEqual([
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: headingFontPreload,
        crossorigin: 'anonymous',
      },
    ])
  })

  it('are the latin files of Source Sans 3 regular and ZT Gatha bold in typography.css', () => {
    const { urls, missing } = pickFontFiles(TYPOGRAPHY_CSS, PRELOADED_FACES)
    const [body = '', heading] = urls
    // The build puts a content hash before the extension.
    const built = fileName(body).replace(/\.woff2$/, '.Bo_j9asI.woff2')

    expect(missing).toEqual([])
    expect(heading).toBe(headingFontPreload)
    expect(built).toMatch(bodyFontPreload)
  })

  it('mark the latin upright body font file of the build as a preload', () => {
    const latin = 'source-sans-3-latin-wght-normal.Bo_j9asI.woff2'
    const others = [
      'source-sans-3-latin-ext-wght-normal.C8iNium2.woff2',
      'source-sans-3-latin-wght-italic.DLiStKT6.woff2',
    ]
    const manifest = entryWithAssets([others[0]!, latin, others[1]!])

    markBodyFontPreload(manifest)

    expect(manifest[latin]).toEqual({
      file: latin,
      resourceType: 'font',
      mimeType: 'font/woff2',
      preload: true,
    })
    expect(others.filter((file) => manifest[file]?.preload)).toEqual([])
  })

  it('stop the build when the body font file is not among the entry assets', () => {
    const manifest = entryWithAssets([
      'source-sans-3-latin-wght-italic.a.woff2',
    ])

    expect(() => markBodyFontPreload(manifest)).toThrow(/cannot be preloaded/)
  })

  // The dev server's manifest has entries without assets.
  it('leave the manifest of the dev server alone', () => {
    const manifest = entryWithAssets([])
    const before = structuredClone(manifest)
    vi.stubEnv('NODE_ENV', 'development')

    try {
      markBodyFontPreload(manifest)
    } finally {
      vi.unstubAllEnvs()
    }

    expect(manifest).toEqual(before)
  })

  it.each(['production', ''])(
    'stop a build without the file when NODE_ENV is "%s"',
    (mode) => {
      vi.stubEnv('NODE_ENV', mode)

      try {
        expect(() => markBodyFontPreload(entryWithAssets([]))).toThrow(
          /cannot be preloaded/,
        )
      } finally {
        vi.unstubAllEnvs()
      }
    },
  )

  // Needs `nuxt build` first. CI sets REQUIRE_BUILT_FONTS so a missing build
  // fails instead of skipping.
  describe.skipIf(
    !process.env.REQUIRE_BUILT_FONTS && !existsSync(BUILT_ASSETS),
  )('in the build', () => {
    const builtCss = () =>
      globSync('entry.*.css', { cwd: BUILT_ASSETS })
        .map((file) => readFileSync(resolve(BUILT_ASSETS, file), 'utf8'))
        .join('\n')

    it('are the files the built CSS loads', () => {
      const { urls, missing } = pickFontFiles(builtCss(), PRELOADED_FACES)
      const [body = '', heading] = urls.map(
        (url) => new URL(url, ASSETS_URL).pathname,
      )

      expect(missing, STALE_BUILD).toEqual([])
      expect(heading).toBe(headingFontPreload)
      expect(fileName(body), STALE_BUILD).toMatch(bodyFontPreload)
      expect(
        existsSync(resolve(FRONTEND, '.output/public', `.${body}`)),
        STALE_BUILD,
      ).toBe(true)
      // The server renders a preload link for every manifest record that
      // carries `preload`.
      const record = new RegExp(
        `\\{[^{}]*file:"${fileName(body)}"[^{}]*preload:true[^{}]*\\}`,
      )
      expect(readFileSync(BUILT_MANIFEST, 'utf8'), STALE_BUILD).toMatch(record)
    })

    it.each(STYLES)(
      'keep the %s latin rule after the latin-ext rule',
      (style) => {
        expect(bodyFontSubsets(builtCss(), style), STALE_BUILD).toEqual([
          'latin-ext',
          'latin',
        ])
      },
    )
  })

  // Both ranges claim U+0152-0153 and a few others. A browser tries the rule
  // declared last first, so latin-ext must not be last: it lacks them.
  it.each(STYLES)(
    'belong to a body font whose %s latin rule comes after its latin-ext rule',
    (style) => {
      expect(bodyFontSubsets(TYPOGRAPHY_CSS, style)).toEqual([
        'latin-ext',
        'latin',
      ])
    },
  )

  it('come from no other origin and from no build-time download', () => {
    expect(TYPOGRAPHY_CSS).not.toMatch(/https?:\/\//)
    expect(headingFontPreload).toMatch(/^\/fonts\//)
  })

  // `bolder` inside bold text asks for 900; the files have it, the site's
  // design does not.
  it.each(STYLES)('offer the %s body font from 400 to 700 only', (style) => {
    const ranges = bodyFontRules(TYPOGRAPHY_CSS, style).map(
      (block) => /font-weight:\s*(\d[^;]*);/.exec(block)?.[1],
    )

    expect(ranges).toEqual(['400 700', '400 700'])
  })
})

const LATIN = 'U+0000-00FF,U+0131,U+2000-206F'
const LATIN_EXT = 'U+0100-02BA,U+1E00-1E9F'
const BODY = { family: 'Body', weight: 700, style: 'normal' }

function face(url: string, declarations: string) {
  return `@font-face { font-family: "Body"; src: url(${url}) format("woff2"); ${declarations} }`
}

describe('pickFontFiles', () => {
  it('reports a face that is not in the CSS and still returns the others', () => {
    const absent = { family: 'ZT Gatha', weight: 300, style: 'normal' }
    const [sourceSans] = PRELOADED_FACES
    const { urls, missing } = pickFontFiles(TYPOGRAPHY_CSS, [
      sourceSans!,
      absent,
    ])

    expect(urls).toHaveLength(1)
    expect(missing).toEqual([absent])
  })

  it('takes the latin file when latin-ext has the same weight', () => {
    const css = [
      face('ext.woff2', `font-weight: 700; unicode-range: ${LATIN_EXT};`),
      face('latin.woff2', `font-weight: 700; unicode-range: ${LATIN};`),
    ].join('\n')

    expect(pickFontFiles(css, [BODY])).toEqual({
      urls: ['latin.woff2'],
      missing: [],
    })
  })

  it('does not guess between two latin files of the same face', () => {
    const css = [
      face('a.woff2', `font-weight: 700; unicode-range: ${LATIN};`),
      face('b.woff2', `font-weight: 700; unicode-range: ${LATIN};`),
    ].join('\n')

    expect(pickFontFiles(css, [BODY])).toEqual({ urls: [], missing: [BODY] })
  })

  it('accepts a variable weight range that covers the wanted weight', () => {
    const css = face('variable.woff2', 'font-weight: 200 900;')

    expect(pickFontFiles(css, [BODY]).urls).toEqual(['variable.woff2'])
  })

  it('keeps italic and upright apart', () => {
    const css = face('italic.woff2', 'font-weight: 700; font-style: italic;')

    expect(pickFontFiles(css, [BODY]).missing).toEqual([BODY])
  })
})

describe('heading font', () => {
  const HEADING_WEIGHTS = ['600', '700']
  const faces = [
    ...readFileSync(
      resolve(FRONTEND, 'app/assets/css/typography.css'),
      'utf8',
    ).matchAll(/@font-face\s*\{([^}]*)\}/g),
  ]
    .map(([, block = '']) => block)
    .filter((block) => /font-family:\s*'ZT Gatha';/.test(block))

  it('has one self-hosted file for each weight headings use', () => {
    const weights = faces.map(
      (block) => /font-weight:\s*(\d+)/.exec(block)?.[1],
    )
    const files = faces.map((block) => /url\('([^']+)'\)/.exec(block)?.[1])

    expect(weights.sort()).toEqual(HEADING_WEIGHTS)
    for (const file of files) {
      expect(existsSync(resolve(FRONTEND, `public${file}`)), file).toBe(true)
    }
  })

  it('swaps in over the fallback instead of hiding the text', () => {
    for (const block of faces) {
      expect(block).toMatch(/font-display:\s*swap/)
    }
  })
})
