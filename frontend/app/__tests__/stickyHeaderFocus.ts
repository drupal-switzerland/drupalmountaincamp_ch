import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const BASE_CSS = read('app/assets/css/tailwind.css')
const HEADER = read('app/components/PageHeader/index.vue')
const LAYOUT = read('app/layouts/default.vue')
const NEWS_LIST = read('app/pages/news/index.vue')

describe('focus below the sticky header', () => {
  it('pads scrolling by the header height and the focus ring', () => {
    expect(BASE_CSS).toMatch(
      /scroll-padding-top: calc\(\s*var\(--page-header-height\) \+ var\(--focus-ring-width\) \+\s*var\(--focus-ring-offset\)\s*\);/,
    )
  })

  it('takes the header height from the same variable', () => {
    expect(BASE_CSS).toMatch(/--page-header-height: theme\(spacing\.12\);/)
    expect(BASE_CSS).toMatch(
      /@screen md \{\s*:root \{\s*--page-header-height: theme\(spacing\.20\);/,
    )
    expect(HEADER).toContain('md:h-[var(--page-header-height)]')
    expect(HEADER).toContain(
      "'h-[var(--page-header-height)] md:max-h-screen': !isMenuOpen",
    )
  })

  it('leaves no scroll margin that would add to the padding', () => {
    expect(LAYOUT).not.toMatch(/scroll-mt-/)
    expect(NEWS_LIST).not.toMatch(/scroll-mt-/)
  })
})
