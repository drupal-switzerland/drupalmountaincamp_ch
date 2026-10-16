import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TextImage from '../components/Paragraph/TextImage/index.vue'
import {
  CAROUSEL_SLIDE_HEADING,
  type CarouselSlideHeading,
} from '../composables/carouselSlideHeading'
import { FIRST_PARAGRAPH_IN_FIRST_VIEWPORT } from '../composables/firstViewport'

const { paragraph } = vi.hoisted(() => ({
  paragraph: { index: 0, parentType: undefined as string | undefined },
}))

// A top-level paragraph unless a test sets a parent, at the position set per
// test.
mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(paragraph.index),
  parentType: ref(paragraph.parentType),
  options: ref({ imagePosition: 'right', spacing: 'none' }),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

const image = {
  image: {
    alt: 'Attendees',
    wide: {
      urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
      width: 1090,
      height: 727,
    },
  },
}

async function imageLoading(belowTopImage?: boolean, isInViewAtLoad?: boolean) {
  const wrapper = await mountSuspended(TextImage, {
    props: { title: 'Community', text: '<p>Text</p>', image, isInViewAtLoad },
    global:
      belowTopImage === undefined
        ? {}
        : {
            provide: {
              [FIRST_PARAGRAPH_IN_FIRST_VIEWPORT as symbol]: !belowTopImage,
            },
          },
  })
  return wrapper.get('img').attributes('loading')
}

async function headings(title: string | undefined, parentType?: string) {
  paragraph.parentType = parentType
  const wrapper = await mountSuspended(TextImage, {
    props: { title, text: '<p>Text</p>', image },
  })
  return wrapper.findAll('h2').map((heading) => heading.text())
}

async function headingTags(
  parentType: string | undefined,
  slideHeading?: CarouselSlideHeading,
) {
  paragraph.parentType = parentType
  const wrapper = await mountSuspended(TextImage, {
    props: { title: 'Community', text: '<p>Text</p>', image },
    global: slideHeading
      ? {
          provide: {
            [CAROUSEL_SLIDE_HEADING as symbol]: computed(() => slideHeading),
          },
        }
      : {},
  })
  return wrapper
    .findAll('h2, h3')
    .map(
      (heading) => `${heading.element.tagName.toLowerCase()} ${heading.text()}`,
    )
}

describe('text image paragraph', () => {
  beforeEach(() => {
    paragraph.index = 0
    paragraph.parentType = undefined
  })

  it('has a heading only when it has a title, on a page and as a carousel slide', async () => {
    expect(await headings('Community')).toEqual(['Community'])
    expect(await headings('Community', 'carousel')).toEqual(['Community'])
    expect(await headings(undefined)).toEqual([])
    expect(await headings('', 'carousel')).toEqual([])
    expect(await headings('  \n')).toEqual([])
    expect(await headings('  \n', 'carousel')).toEqual([])
    expect(await headings(undefined, 'carousel')).toEqual([])
  })

  it('as a carousel slide, takes its heading level from the carousel', async () => {
    expect(await headingTags('carousel', 'h3')).toEqual(['h3 Community'])
    expect(await headingTags('carousel', 'h2')).toEqual(['h2 Community'])
    expect(await headingTags('carousel')).toEqual(['h2 Community'])
  })

  // The base styles set h3 in a lighter weight than h2; the slide title keeps
  // its weight at either level.
  it('as a carousel slide, sets its title bold at either level', async () => {
    paragraph.parentType = 'carousel'
    for (const level of ['h2', 'h3'] as const) {
      const wrapper = await mountSuspended(TextImage, {
        props: { title: 'Community', text: '<p>Text</p>', image },
        global: {
          provide: {
            [CAROUSEL_SLIDE_HEADING as symbol]: computed(() => level),
          },
        },
      })
      expect(wrapper.get(level).classes()).toContain('font-bold')
    }
  })

  it('stays an h2 on a page, whatever a carousel around it says', async () => {
    expect(await headingTags(undefined, 'h3')).toEqual(['h2 Community'])
  })

  it('loads the first paragraph image eagerly when nothing is above it', async () => {
    expect(await imageLoading()).toBe('eager')
    expect(await imageLoading(false)).toBe('eager')
  })

  it('loads it lazily below a hero or top image, which takes the first viewport', async () => {
    expect(await imageLoading(true)).toBe('lazy')
  })

  it('loads the image of a later paragraph lazily on any page', async () => {
    paragraph.index = 2

    expect(await imageLoading()).toBe('lazy')
    expect(await imageLoading(true)).toBe('lazy')
  })

  // Every slide has a first position among its siblings; which one is on
  // screen is the carousel's to say.
  it('as a carousel slide, loads its image eagerly only when the carousel says it is in view', async () => {
    paragraph.parentType = 'carousel'

    expect(await imageLoading()).toBe('lazy')
    expect(await imageLoading(false, false)).toBe('lazy')
    expect(await imageLoading(false, true)).toBe('eager')
  })

  it('ignores that flag on a page', async () => {
    paragraph.index = 2

    expect(await imageLoading(false, true)).toBe('lazy')
  })
})
