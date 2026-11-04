import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RIDGE_DEEPEST_VALLEY, RIDGE_SIZE } from '../helpers/ridge'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const TAILWIND_CSS = read('app/assets/css/tailwind.css')
const BRAND_CSS = read('app/assets/css/components/brand.css')
const LAYOUT = read('app/layouts/default.vue')
const EVENT_STRIP = read('app/components/PageHeader/EventStrip.vue')
const HOME_HERO = read('app/components/HomeHero/index.vue')
const PAGE_HERO = read('app/components/PageHero/index.vue')

describe('heroes fill the first screen', () => {
  it('measures the first screen below the sticky header', () => {
    expect(TAILWIND_CSS).toContain(
      '--first-screen: calc(100vh - var(--page-header-height));',
    )
    expect(TAILWIND_CSS).toMatch(
      /@supports \(height: 100svh\) \{\s*:root \{\s*--first-screen: calc\(100svh - var\(--page-header-height\)\);/,
    )
  })

  it('takes the event strip height from the variable the hero subtracts', () => {
    expect(EVENT_STRIP).toContain('h-[var(--event-strip-height)]')
    expect(EVENT_STRIP).not.toMatch(/\bh-1[02]\b/)
    expect(TAILWIND_CSS).toContain('--event-strip-height: theme(spacing.12);')
    expect(TAILWIND_CSS).toMatch(
      /@media \(min-width: 390px\) \{\s*:root \{\s*--event-strip-height: theme\(spacing\.10\);/,
    )
  })

  // The strip is above every page but home.
  it('subtracts the strip on inner pages only', () => {
    expect(LAYOUT).toContain(
      `<PageHeaderEventStrip v-if="route.name !== 'home'" />`,
    )
    expect(PAGE_HERO).toContain(
      'min-height: calc(var(--first-screen) - var(--event-strip-height));',
    )
    expect(HOME_HERO).toContain('home-hero-screen')
    expect(BRAND_CSS).toMatch(
      /\.home-hero-screen \{\s*min-height: var\(--first-screen\);/,
    )
  })

  // A taller screen adds navy above the badge, so the ridge stays at the bottom.
  it('keeps the homepage ridge at the bottom of a taller screen', () => {
    expect(HOME_HERO).toContain('home-hero-screen relative flex flex-col')
    expect(HOME_HERO).toContain(
      'home-hero relative isolate flex flex-1 flex-col',
    )
    expect(HOME_HERO).toContain('!mb-0 !mt-auto')
  })

  it('centres the inner-page text in a taller screen', () => {
    expect(PAGE_HERO).toContain('page-hero relative isolate flex flex-col')
    expect(PAGE_HERO).toContain('flex-1 content-center')
  })

  it('shows no plus marks in either hero', () => {
    expect(HOME_HERO).not.toContain('BrandSparkles')
    expect(PAGE_HERO).not.toContain('BrandSparkles')
  })
})

describe('edition band on the homepage ridge', () => {
  // vw per drawing unit: the wide ridge shows the whole drawing at full width.
  const deepestValleyVw =
    ((RIDGE_SIZE.height - RIDGE_DEEPEST_VALLEY) / RIDGE_SIZE.width) * 100
  const MIN_GAP_VW = 1

  it('starts below the deepest valley, so no ridge line crosses its text', () => {
    const overlap = HOME_HERO.match(/md:mt-\[-(\d+(?:\.\d+)?)vw\]/)

    expect(overlap).not.toBeNull()
    expect(Number(overlap![1]) + MIN_GAP_VW).toBeLessThanOrEqual(
      deepestValleyVw,
    )
    expect(HOME_HERO).toContain('md:pt-0')
  })

  // Transparent from md so the snow shows; the section's ice carries on
  // below the ridge.
  it('has ice behind it at every width', () => {
    expect(HOME_HERO).toContain('bg-primary-100 text-primary-500 md:mt-[')
    expect(HOME_HERO).toContain('md:bg-transparent')
    expect(HOME_HERO).toContain('flex flex-col md:bg-primary-100')
  })

  it('has no dividing lines', () => {
    const band = HOME_HERO.slice(HOME_HERO.indexOf('edition.label') - 600)

    expect(band).not.toMatch(/\bborder(-[a-z]+)*\b/)
  })

  // The title block, When and Where each span the band's two rows as
  // subgrids, so every label sits on one baseline and every value on another.
  it('lines up labels and values across the columns from md', () => {
    const COLUMN =
      'flex flex-col gap-1 md:row-span-2 md:grid md:grid-rows-subgrid md:items-baseline'

    expect(HOME_HERO.split(COLUMN)).toHaveLength(4)
    expect(HOME_HERO).toContain(
      'md:col-span-2 md:row-span-2 md:grid-cols-subgrid md:grid-rows-subgrid',
    )
    expect(HOME_HERO).toContain('md:grid-rows-[auto_auto] md:items-baseline')
    expect(HOME_HERO).toContain('md:row-span-2 md:mt-0 md:self-center')
  })
})
