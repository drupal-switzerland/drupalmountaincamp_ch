import { afterEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import Slider from '../components/Paragraph/Carousel/Slider.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

const SLIDE_COUNT = 2

const slides = Array.from({ length: SLIDE_COUNT }, (_, i) => ({
  uuid: `slide-${i}`,
  bundle: 'text_image',
  isVisible: true,
  options: {},
  props: {
    title: `Slide ${i}`,
    text: '<p>Text</p>',
    image: {
      copyright: 'Photographer',
      image: {
        alt: 'Attendees',
        wide: {
          urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
          width: 1090,
          height: 727,
        },
      },
    },
  },
}))

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

// blökkli and the text image paragraph are the real ones here: the slide
// layout depends on what the slider hands to blökkli.
describe('text image paragraph as a carousel slide', () => {
  it('renders the slide layout, not the page layout', async () => {
    wrapper = await mountSuspended(Slider, {
      props: { slides: slides as never },
      attachTo: document.body,
    })
    await nextTick()
    const rendered = wrapper.findAll('.swiper-slide')

    expect(rendered.length).toBeGreaterThanOrEqual(SLIDE_COUNT)
    for (const slide of rendered) {
      expect(slide.find('.swiper-carousel-left').exists()).toBe(true)
      expect(slide.find('.swiper-carousel-content h2').exists()).toBe(true)
      expect(slide.find('.container').exists()).toBe(false)
    }
  })

  // This pins what the slider does now, not what it should end up doing: the
  // slide that is active at load is in view and should load eagerly.
  it('loads no slide image eagerly', async () => {
    wrapper = await mountSuspended(Slider, {
      props: { slides: slides as never },
      attachTo: document.body,
    })
    await nextTick()
    const loading = wrapper
      .findAll('.swiper-slide img')
      .map((img) => img.attributes('loading'))

    expect(loading.length).toBeGreaterThanOrEqual(SLIDE_COUNT)
    expect(new Set(loading)).toEqual(new Set(['lazy']))
  })
})
