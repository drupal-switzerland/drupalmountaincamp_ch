// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RIDGE_DEEPEST_VALLEY,
  RIDGE_SIZE,
  RIDGE_STROKE_WIDTH,
} from '../helpers/ridge'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const TAILWIND_CSS = read('app/assets/css/tailwind.css')
const BRAND_CSS = read('app/assets/css/components/brand.css')
const PRINT_CSS = read('app/assets/css/components/print.css')
const LAYOUT = read('app/layouts/default.vue')
const EVENT_STRIP = read('app/components/PageHeader/EventStrip.vue')
const HOME_HERO = read('app/components/HomeHero/index.vue')
const PAGE_HERO = read('app/components/PageHero/index.vue')

const BAND = HOME_HERO.slice(
  HOME_HERO.indexOf("<!-- From md it sits on the ridge's snow"),
  HOME_HERO.indexOf('</section>'),
)

// Class attributes only, so comments that name a class do not count.
const BAND_CLASSES = [...BAND.matchAll(/class="([^"]*)"/g)]
  .map((m) => m[1])
  .join(' ')

describe('heroes fill the first screen', () => {
  it('measures the first screen below the sticky header, svh where supported', () => {
    expect(TAILWIND_CSS).toContain(
      '--first-screen: calc(100vh - var(--page-header-height));',
    )
    expect(TAILWIND_CSS).toMatch(
      /@supports \(height: 100svh\) \{\s*:root \{\s*--first-screen: calc\(100svh - var\(--page-header-height\)\);/,
    )
  })

  // The hero subtracts the strip, so the strip must be exactly that tall.
  it('sizes the event strip with the variable the inner hero subtracts', () => {
    expect(EVENT_STRIP).toContain('h-[var(--event-strip-height)]')
    expect(EVENT_STRIP).not.toMatch(/(^|\s)(min-\[390px\]:)?h-1[02](\s|")/)
    expect(PAGE_HERO).toContain(
      'min-height: calc(var(--first-screen) - var(--event-strip-height));',
    )
  })

  // The strip is above every page but home, which has the homepage hero.
  it('subtracts the strip on inner pages only', () => {
    expect(LAYOUT).toContain(
      `<PageHeaderEventStrip v-if="route.name !== 'home'" />`,
    )
    expect(HOME_HERO).toContain('home-hero-screen')
    expect(BRAND_CSS).toMatch(
      /\.home-hero-screen \{\s*min-height: var\(--first-screen\);/,
    )
  })

  it('lets both heroes be as tall as their content on paper', () => {
    expect(PRINT_CSS).toMatch(
      /\.home-hero-screen,\s*\.page-hero \{\s*min-height: 0 !important;/,
    )
  })

  it('shows no plus marks in either hero', () => {
    expect(HOME_HERO).not.toContain('BrandSparkles')
    expect(PAGE_HERO).not.toContain('BrandSparkles')
  })
})

describe('edition band on the homepage ridge', () => {
  // The wide ridge shows the whole drawing at full width, so a drawing unit
  // is 100 / 1920 vw. The white outline reaches half its stroke below the
  // skyline.
  const strokeBottomVw =
    ((RIDGE_SIZE.height - RIDGE_DEEPEST_VALLEY - RIDGE_STROKE_WIDTH / 2) /
      RIDGE_SIZE.width) *
    100
  const MIN_GAP_VW = 1

  it('starts below the lowest ridge stroke, so no line crosses its text', () => {
    const overlap = BAND.match(/md:mt-\[-(\d+(?:\.\d+)?)vw\]/)

    expect(overlap).not.toBeNull()
    expect(Number(overlap![1]) + MIN_GAP_VW).toBeLessThanOrEqual(strokeBottomVw)
    expect(BAND).toContain('md:pt-0')
  })

  it('has no dividing lines', () => {
    expect(BAND).toContain('10th anniversary gathering')
    expect(BAND).not.toMatch(/\bborder(-[a-z0-9]+)*\b/)
  })

  // A subgrid takes its own gap: without repeating the band's column gap,
  // When and Where would sit closer together than the title and When.
  it('keeps one column gap across the subgrid', () => {
    const gaps = BAND_CLASSES.match(/md:gap-x-\d+/g)

    expect(gaps).toHaveLength(2)
    expect(new Set(gaps).size).toBe(1)
    expect(BAND).toContain('md:grid-cols-subgrid md:grid-rows-subgrid')
  })

  it('keeps room for Where when editors lengthen the title', () => {
    expect(BAND).toMatch(
      /md:grid-cols-\[minmax\(0,max-content\)_minmax\(0,max-content\)_minmax\(\d+rem,1fr\)_auto\]/,
    )
  })

  // The strip and footer keep the full venue; the band has a short one.
  // Regexes, because the easy-texts plugin rewrites $texts calls written as
  // strings in this file too.
  it('names the venue with its short text', () => {
    expect(BAND).toMatch(
      /\$texts\('edition\.venueShort', 'Davos Congress Centre'\)/,
    )
    expect(BAND).not.toMatch(/'edition\.venue'/)
    expect(EVENT_STRIP).toMatch(
      /\$texts\('edition\.venue', 'Davos Congress Centre, Switzerland'\)/,
    )
  })
})
