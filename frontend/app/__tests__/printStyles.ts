// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const PRINT_CSS = read('app/assets/css/components/print.css')
const ENTRY_CSS = read('app/assets/css/tailwind.css')

// Sections that are light text on a dark fill on screen, with the class that
// carries the fill. The print rules remove fills from .on-dark and turn the
// text inside it navy, so the marker has to sit on the element with the fill.
const DARK_SECTIONS = [
  ['inner-page hero', 'app/components/PageHero/index.vue', 'brand-hero'],
  ['homepage hero', 'app/components/HomeHero/index.vue', 'home-hero'],
  ['footer', 'app/components/PageFooter/index.vue', 'brand-hero'],
  [
    'footer bottom bar',
    'app/components/PageFooter/index.vue',
    'bg-primary-500',
  ],
  ['navy text band', 'app/components/Paragraph/Text/index.vue', 'navy-band'],
  [
    'week timeline band',
    'app/components/Paragraph/IconTextList/index.vue',
    'week-band',
  ],
  [
    'day card header',
    'app/components/Paragraph/IconTextItem/index.vue',
    'brand-card-header',
  ],
] as const

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('print styles', () => {
  it('are part of the stylesheet', () => {
    expect(ENTRY_CSS).toContain("@import './components/print.css';")
  })

  it('apply in print only', () => {
    expect(withoutComments(PRINT_CSS).split('@media print')[0]!.trim()).toBe('')
  })

  it('remove the fill and darken the text of the same sections', () => {
    const css = withoutComments(PRINT_CSS)

    expect(css).toMatch(
      /\.on-dark,[^{}]*\{\s*color: theme\(colors\.brand\.navy\) !important;/,
    )
    expect(css).toMatch(
      /\.on-dark,[^{}]*\.on-dark \*::after,[^{}]*\{\s*background: none !important;/,
    )
  })

  it.each(DARK_SECTIONS)(
    '%s carries on-dark on the element with its fill',
    (_name, path, fill) => {
      const classLists = [
        ...read(path).matchAll(/class="([^"]*)"|return \[([^\]]*)\]/g),
      ].map((match) => (match[1] ?? match[2] ?? '').replace(/['",]/g, ' '))
      const marked = classLists.filter((list) =>
        list.split(/\s+/).includes('on-dark'),
      )

      expect(marked.some((list) => list.split(/\s+/).includes(fill))).toBe(true)
    },
  )

  it('prints the current pagination page without its navy disc', () => {
    expect(read('app/components/Pagination/index.vue')).toContain(
      'bg-primary-500 text-white print:bg-transparent print:text-primary-500',
    )
  })
})
