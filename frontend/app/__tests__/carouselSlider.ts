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
