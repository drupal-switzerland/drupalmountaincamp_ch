// @vitest-environment node
import { existsSync, globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { pickFontFiles } from './support/fontFaces'

const FRONTEND = resolve(import.meta.dirname, '../..')
const BUILT_CSS = resolve(FRONTEND, '.output/public/_nuxt')
// The same directory as the build assets, where the generated CSS points from.
const ASSETS_URL = 'http://localhost/_nuxt/'

// What the preloaded files have to be, in the order of FONT_PRELOADS.
const PRELOADED_FACES = [
  { family: 'Source Sans 3', weight: 400, style: 'normal' },
  { family: 'Zilla Slab', weight: 700, style: 'normal' },
]

// The @font-face rules @nuxt/fonts wrote into the entry CSS of a production
// build, minified by lightningcss.
const CAPTURED_CSS = readFileSync(
  resolve(import.meta.dirname, 'fixtures/generatedFontFaces.css.txt'),
  'utf8',
)

type HeadLink = Record<string, string>

let preloads: string[]
let links: HeadLink[]

// nuxt.config.ts calls the defineNuxtConfig global, which only exists while
// Nuxt loads it.
beforeAll(async () => {
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
  const module = await import('../../nuxt.config')
  preloads = module.FONT_PRELOADS
  links = (module.default as { app: { head: { link: HeadLink[] } } }).app.head
    .link
  vi.unstubAllGlobals()
})

function latinFiles(css: string) {
  const { urls, missing } = pickFontFiles(css, PRELOADED_FACES)
  return {
    files: urls.map((url) => new URL(url, ASSETS_URL).pathname),
    missing,
  }
}

describe('font preloads', () => {
  it('are the only links in the head, as cross-origin woff2 font preloads', () => {
    expect(links).toEqual(
      preloads.map((href) => ({
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href,
        crossorigin: 'anonymous',
      })),
    )
  })

  it('are the latin files of Source Sans 3 regular and Zilla Slab bold', () => {
    expect(latinFiles(CAPTURED_CSS)).toEqual({ files: preloads, missing: [] })
  })

  // Needs `nuxt build` first. CI sets REQUIRE_BUILT_FONTS so a missing build
  // fails instead of skipping.
  it.skipIf(!process.env.REQUIRE_BUILT_FONTS && !existsSync(BUILT_CSS))(
    'match the font files of the current build',
    () => {
      const css = globSync('entry.*.css', { cwd: BUILT_CSS })
        .map((file) => readFileSync(resolve(BUILT_CSS, file), 'utf8'))
        .join('\n')

      expect(latinFiles(css)).toEqual({ files: preloads, missing: [] })
    },
  )
})

const LATIN = 'U+0000-00FF,U+0131,U+2000-206F'
const LATIN_EXT = 'U+0100-02BA,U+1E00-1E9F'
const BODY = { family: 'Body', weight: 700, style: 'normal' }

function face(url: string, declarations: string) {
  return `@font-face { font-family: "Body"; src: url(${url}) format("woff2"); ${declarations} }`
}

describe('pickFontFiles', () => {
  it('reports a face that is not in the CSS and still returns the others', () => {
    const absent = { family: 'Zilla Slab', weight: 300, style: 'normal' }
    const [sourceSans] = PRELOADED_FACES
    const { urls, missing } = pickFontFiles(CAPTURED_CSS, [sourceSans!, absent])

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
