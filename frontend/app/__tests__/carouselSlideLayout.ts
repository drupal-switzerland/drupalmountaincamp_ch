import { afterEach, describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import Slider from '../components/Paragraph/Carousel/Slider.vue'
import { CAROUSEL_SLIDE_HEADING } from '../composables/carouselSlideHeading'

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

  // Two slides are rendered three times over, so the first slide has three
  // copies. Only the copy the slider starts on is on screen.
  it('loads only the image of the copy it starts on eagerly, in the first viewport', async () => {
    wrapper = await mountSuspended(Slider, {
      props: { slides: slides as never, eagerFirstSlide: true },
      attachTo: document.body,
    })
    await nextTick()
    const images = wrapper.findAll('.swiper-slide img')
    const eager = images.filter((img) => img.attributes('loading') === 'eager')

    expect(images).toHaveLength(SLIDE_COUNT * 3)
    expect(eager).toHaveLength(1)
    expect(eager[0]!.attributes('fetchpriority')).toBe('high')
    expect(eager[0]!.element.closest('.swiper-slide')!.classList).toContain(
      'swiper-slide-active',
    )
    expect(wrapper.get('.swiper-slide-active h2').text()).toBe('Slide 0')
  })

  it('heads each slide at the level the carousel gives it', async () => {
    wrapper = await mountSuspended(Slider, {
      props: { slides: slides as never },
      attachTo: document.body,
      global: {
        provide: { [CAROUSEL_SLIDE_HEADING as symbol]: computed(() => 'h3') },
      },
    })
    await nextTick()

    expect(wrapper.findAll('.swiper-slide h2')).toHaveLength(0)
    expect(wrapper.findAll('.swiper-slide h3').length).toBeGreaterThanOrEqual(
      SLIDE_COUNT,
    )
  })

  it('loads no slide image eagerly below the first viewport', async () => {
    wrapper = await mountSuspended(Slider, {
      props: { slides: slides as never },
      attachTo: document.body,
    })
    await nextTick()
    const loading = wrapper
      .findAll('.swiper-slide img')
      .map((img) => img.attributes('loading'))

    expect(loading).toHaveLength(SLIDE_COUNT * 3)
    expect(new Set(loading)).toEqual(new Set(['lazy']))
  })
})
