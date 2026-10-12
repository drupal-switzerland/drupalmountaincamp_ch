import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Slider from '../components/Paragraph/Carousel/Slider.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const SlideStub = defineComponent({
  props: { uuid: { type: String, default: '' } },
  setup(props) {
    return () => h('p', props.uuid)
  },
})

async function mountSlider() {
  const wrapper = await mountSuspended(Slider, {
    props: { slides: [{ uuid: 'one' }, { uuid: 'two' }] as never },
    global: { stubs: { BlokkliItem: SlideStub } },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

const activeSlide = (wrapper: Awaited<ReturnType<typeof mountSlider>>) =>
  wrapper.get('.swiper-slide-active').text()

describe('carousel slides', () => {
  it('leaves only the active slide to the keyboard and assistive technology', async () => {
    const wrapper = await mountSlider()
    const exposed = () =>
      wrapper
        .findAll('.swiper-slide')
        .filter((slide) => !slide.element.hasAttribute('inert'))

    expect(exposed()).toHaveLength(1)
    expect(exposed()[0]!.classes()).toContain('swiper-slide-active')

    await wrapper.findAll('button')[1]!.trigger('click')
    expect(exposed()).toHaveLength(1)
    expect(exposed()[0]!.classes()).toContain('swiper-slide-active')
    wrapper.unmount()
  })

  // Inert slides take no pointer, so the swipe must not depend on them.
  it('takes touches on the container, which spans the clipped strip', async () => {
    const wrapper = await mountSlider()
    const container = wrapper.get('.swiper')

    expect(container.classes()).toEqual(
      expect.arrayContaining(['!-mx-[100vw]', '!px-[100vw]']),
    )
    expect(
      wrapper.findComponent({ name: 'Swiper' }).props('touchEventsTarget'),
    ).toBe('container')
    wrapper.unmount()
  })
})

describe('carousel slider', () => {
  it('shows named previous and next buttons at every width', async () => {
    const wrapper = await mountSlider()
    const buttons = wrapper.findAll('button')

    expect(buttons.map((button) => button.text())).toEqual([
      'slides.prev',
      'slides.next',
    ])
    for (const button of buttons) {
      expect(button.attributes('type')).toBe('button')
      expect(button.element.closest('.hidden')).toBeNull()
    }
    wrapper.unmount()
  })

  it('changes the slide with the buttons', async () => {
    const wrapper = await mountSlider()
    const [previous, next] = wrapper.findAll('button')
    const first = activeSlide(wrapper)

    await next!.trigger('click')
    expect(activeSlide(wrapper)).not.toBe(first)

    await previous!.trigger('click')
    expect(activeSlide(wrapper)).toBe(first)
    wrapper.unmount()
  })
})
