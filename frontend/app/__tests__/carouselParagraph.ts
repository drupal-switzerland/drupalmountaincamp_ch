import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, inject } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import Carousel from '../components/Paragraph/Carousel/index.vue'
import Slider from '../components/Paragraph/Carousel/Slider.vue'
import { CAROUSEL_SLIDE_HEADING } from '../composables/carouselSlideHeading'
import { FIRST_PARAGRAPH_IN_FIRST_VIEWPORT } from '../composables/firstViewport'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const { paragraph } = vi.hoisted(() => ({
  paragraph: { index: 0, parentType: undefined as string | undefined },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  index: ref(paragraph.index),
  parentType: ref(paragraph.parentType),
}))

async function headings(title: string | undefined) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title, slides: [] } as never,
    global: { stubs: { BlokkliField: true } },
  })
  return wrapper.findAll('h2').map((heading) => heading.text())
}

// Renders what the carousel puts into the field, as blökkli does in proxy mode.
const FieldStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => h('div', slots.default?.({ items: [] }))
  },
})

async function eagerFirstSlide(belowTopImage: boolean) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title: 'Impressions', slides: [] } as never,
    global: {
      stubs: { BlokkliField: FieldStub },
      provide: {
        [FIRST_PARAGRAPH_IN_FIRST_VIEWPORT as symbol]: !belowTopImage,
      },
    },
  })
  // The slider is loaded on demand.
  await flushPromises()
  return wrapper.getComponent(Slider).props('eagerFirstSlide')
}

// Stands in for the field and reads what the carousel gives its slides.
const SlideHeadingProbe = defineComponent({
  setup() {
    const heading = inject(CAROUSEL_SLIDE_HEADING)
    return () => h('span', { 'data-test': 'slide-heading' }, heading?.value)
  },
})

async function slideHeading(title: string | undefined) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title, slides: [] } as never,
    global: { stubs: { BlokkliField: SlideHeadingProbe } },
  })
  return wrapper.get('[data-test="slide-heading"]').text()
}

describe('carousel paragraph', () => {
  beforeEach(() => {
    paragraph.index = 0
    paragraph.parentType = undefined
  })

  it('has a heading only when it has a title', async () => {
    expect(await headings('Impressions')).toEqual(['Impressions'])
    expect(await headings('')).toEqual([])
    expect(await headings('  \n')).toEqual([])
    expect(await headings(undefined)).toEqual([])
  })

  it('heads its slides one level below its title, and at its level without one', async () => {
    expect(await slideHeading('Impressions')).toBe('h3')
    expect(await slideHeading('')).toBe('h2')
    expect(await slideHeading('  \n')).toBe('h2')
    expect(await slideHeading(undefined)).toBe('h2')
  })

  it('tells its slider that it is in the first viewport as the first paragraph with nothing above it', async () => {
    expect(await eagerFirstSlide(false)).toBe(true)
  })

  it('does not below a hero or top image, which takes the first viewport', async () => {
    expect(await eagerFirstSlide(true)).toBe(false)
  })

  it('does not as a later paragraph', async () => {
    paragraph.index = 2

    expect(await eagerFirstSlide(false)).toBe(false)
  })
})
