import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import Slider from '../components/Paragraph/Carousel/Slider.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const SlideStub = defineComponent({
  props: {
    uuid: { type: String, default: '' },
    parentType: { type: String, default: '' },
    index: { type: Number, default: -1 },
    props: { type: Object, default: () => ({}) },
  },
  setup(props) {
    return () =>
      h(
        'p',
        {
          'data-parent-type': props.parentType,
          'data-index': props.index,
          'data-in-view-at-load': String(!!props.props.isInViewAtLoad),
        },
        props.uuid,
      )
  },
})

type Mounted = VueWrapper
let wrapper: Mounted | undefined

async function mountSlider(slideCount = 2, eagerFirstSlide = false) {
  const slides = Array.from({ length: slideCount }, (_, i) => ({
    uuid: `slide-${i}`,
  }))
  wrapper = await mountSuspended(Slider, {
    props: { slides: slides as never, eagerFirstSlide },
    global: { stubs: { BlokkliItem: SlideStub } },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

const activeSlide = (mounted: Mounted) =>
  mounted.get('.swiper-slide-active').text()

const exposedSlides = (mounted: Mounted) =>
  mounted
    .findAll('.swiper-slide')
    .filter((slide) => !slide.element.hasAttribute('inert'))

describe('carousel slides', () => {
  // Two slides are rendered three times over for the loop, three twice.
  it.each([2, 3])(
    'leaves only the active slide to the keyboard and assistive technology, with %i slides',
    async (slideCount) => {
      const mounted = await mountSlider(slideCount)

      expect(exposedSlides(mounted)).toHaveLength(1)
      expect(exposedSlides(mounted)[0]!.classes()).toContain(
        'swiper-slide-active',
      )

      await mounted.findAll('button')[1]!.trigger('click')
      expect(exposedSlides(mounted)).toHaveLength(1)
      expect(exposedSlides(mounted)[0]!.classes()).toContain(
        'swiper-slide-active',
      )
    },
  )

  // Swiper always reports an active slide that exists; the rule for the case
  // it does not is to hide nothing rather than everything.
  it('hides no slide when none is known to be active', async () => {
    const mounted = await mountSlider(6)
    const slides = mounted
      .findAll('.swiper-slide')
      .map((slide) => slide.element)

    mounted
      .findComponent({ name: 'Swiper' })
      .vm.$emit('activeIndexChange', { slides, activeIndex: slides.length })
    expect(exposedSlides(mounted)).toHaveLength(6)
  })

  // startIndex and initialSlide are two expressions for the same copy. The
  // test DOM shows the copy Swiper marks active for one to five slides; with
  // six or more initialSlide is past the end, the test DOM marks none, and the
  // match rests on a browser check (rendered index 0 for six and seven).
  it.each([1, 2, 3, 4, 5])(
    'marks the copy Swiper starts on as in view at load, with %i slides',
    async (slideCount) => {
      const mounted = await mountSlider(slideCount, true)
      const marked = mounted.findAll('[data-in-view-at-load="true"]')

      expect(marked).toHaveLength(1)
      expect(marked[0]!.element.closest('.swiper-slide')!.classList).toContain(
        'swiper-slide-active',
      )
      expect(marked[0]!.text()).toBe('slide-0')
    },
  )

  // Inert slides take no pointer, so the swipe must not depend on them.
  it('takes touches on the container', async () => {
    const mounted = await mountSlider()

    expect(
      mounted.findComponent({ name: 'Swiper' }).props('touchEventsTarget'),
    ).toBe('container')
  })

  // The slide animation measures the container's own box (Animation.ts), so
  // the area that takes a press beside the slide is a pseudo-element, and the
  // box itself keeps the slide's width.
  it('widens the area that takes a press, not the container', async () => {
    const mounted = await mountSlider()
    const classes = mounted.get('.swiper').classes()

    expect(classes).toEqual(
      expect.arrayContaining([
        'before:absolute',
        'before:inset-y-0',
        'before:inset-x-[-100vw]',
      ]),
    )
    expect(classes.filter((name) => /^!?-?[mp][xlrse]?-/.test(name))).toEqual(
      [],
    )
  })
})

// The slides field is in proxy mode: blökkli renders no item itself, so the
// slider is the only place a slide can learn its parent and its position.
describe('what the slider tells blökkli about a slide', () => {
  it('gives every copy the carousel as parent', async () => {
    const mounted = await mountSlider(2)
    const parents = mounted
      .findAll('.swiper-slide p')
      .map((slide) => slide.attributes('data-parent-type'))

    expect(parents).toHaveLength(6)
    expect(new Set(parents)).toEqual(new Set(['carousel']))
  })

  it('gives every copy the position of the slide it repeats', async () => {
    const mounted = await mountSlider(3)
    const slides = mounted
      .findAll('.swiper-slide p')
      .map((slide) => `${slide.text()}@${slide.attributes('data-index')}`)

    expect(slides.toSorted()).toEqual([
      'slide-0@0',
      'slide-0@0',
      'slide-1@1',
      'slide-1@1',
      'slide-2@2',
      'slide-2@2',
    ])
  })
})

describe('carousel slider', () => {
  it('shows named previous and next buttons at every width', async () => {
    const mounted = await mountSlider()
    const buttons = mounted.findAll('button')

    expect(buttons.map((button) => button.text())).toEqual([
      'slides.prev',
      'slides.next',
    ])
    for (const button of buttons) {
      expect(button.attributes('type')).toBe('button')
      expect(button.element.closest('.hidden')).toBeNull()
    }
  })

  it('changes the slide with the buttons', async () => {
    const mounted = await mountSlider()
    const [previous, next] = mounted.findAll('button')
    const first = activeSlide(mounted)

    await next!.trigger('click')
    expect(activeSlide(mounted)).not.toBe(first)

    await previous!.trigger('click')
    expect(activeSlide(mounted)).toBe(first)
  })
})
