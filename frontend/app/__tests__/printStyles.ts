// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const PRINT_CSS = read('app/assets/css/components/print.css')
const ENTRY_CSS = read('app/assets/css/tailwind.css')

// Sections that are light text on a dark fill on screen. Printed without
// backgrounds, their text has to turn dark.
const DARK_SECTIONS = [
  ['inner-page hero', 'app/components/PageHero/index.vue'],
  ['homepage hero', 'app/components/HomeHero/index.vue'],
  ['footer', 'app/components/PageFooter/index.vue'],
  ['navy text band', 'app/components/Paragraph/Text/index.vue'],
  ['week timeline band', 'app/components/Paragraph/IconTextList/index.vue'],
  ['day card header', 'app/components/Paragraph/IconTextItem/index.vue'],
] as const

describe('print styles', () => {
  it('are part of the stylesheet', () => {
    expect(ENTRY_CSS).toContain("@import './components/print.css';")
  })

  it('apply in print only', () => {
    const outside = PRINT_CSS.replace(/\/\*[\s\S]*?\*\//g, '').split(
      '@media print',
    )[0]!

    expect(outside.trim()).toBe('')
  })

  it('print text in dark sections and on filled buttons in navy', () => {
    const declaration = 'color: theme(colors.brand.navy) !important;'
    const beforeDeclaration = PRINT_CSS.split(declaration)[0]!
    const selectors = beforeDeclaration
      .slice(beforeDeclaration.lastIndexOf('@media print {'))
      .replace('@media print {', '')
      .replace('{', '')
      .split(',')
      .map((selector) => selector.trim())

    expect(PRINT_CSS).toContain(declaration)
    expect(selectors).toEqual([
      '.on-dark',
      '.on-dark *',
      '.button.is-filled',
      '.ticket-button',
      "[aria-current='page']",
    ])
  })

  it.each(DARK_SECTIONS)(
    '%s is marked on-dark, which the print rule keys on',
    (_name, path) => {
      expect(read(path)).toMatch(/['" ]on-dark['" ]/)
    },
  )
})
