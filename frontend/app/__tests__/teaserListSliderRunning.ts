import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import TeaserList from '../components/Paragraph/TeaserList/index.vue'
import { SCREENS } from '../tailwind/screens'

// A stand-in for Swiper that records how it was started.
const { started, viewport } = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return {
    started: [] as { options: Record<string, unknown>; destroyed: boolean }[],
    viewport: reactive({ isMdUpwards: true }),
  }
})

vi.mock('../helpers/swiper', () => ({
  loadSwiper: async () =>
    class {
      record: { options: Record<string, unknown>; destroyed: boolean }
      constructor(_el: HTMLElement, options: Record<string, unknown>) {
        this.record = { options, destroyed: false }
        started.push(this.record)
      }

      destroy() {
        this.record.destroyed = true
      }

      slideNext() {}
      slidePrev() {}
    },
}))

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ teaserStyle: 'sliderDesktop', sliderStyle: 'stack' }),
}))

mockNuxtImport('useViewport', () => () => ({
  isSmUpwards: computed(() => true),
  isMdUpwards: computed(() => viewport.isMdUpwards),
}))

const teasers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ uuid: `teaser-${i}` }))

let mounted: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mountList(teaserCount: number) {
  const wrapper = await mountSuspended(TeaserList, {
    props: { title: 'More news', paragraphs: teasers(teaserCount) as never },
    global: { stubs: { BlokkliField: true } },
  })
  await flushPromises()
  mounted = wrapper
  return wrapper
}

afterEach(() => {
  mounted?.unmount()
  mounted = undefined
  started.length = 0
  viewport.isMdUpwards = true
})

describe('teaser list as a running slider', () => {
  it('has named previous and next buttons that are not a navigation landmark', async () => {
    const wrapper = await mountList(4)
    const buttons = wrapper.findAll('button')

    expect(wrapper.find('.is-slider-desktop').exists()).toBe(true)
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual([
      'slides.prev',
      'slides.next',
    ])
    for (const button of buttons) {
      expect(button.attributes('type')).toBe('button')
    }
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  // A resize across md changes the number of teasers per view, and Swiper
  // reads the same width as the stylesheet and useViewport.
  it('shows two teasers per view, three from the md width', async () => {
    await mountList(4)

    expect(started).toHaveLength(1)
    expect(started[0]!.options).toMatchObject({
      slidesPerView: 2,
      breakpoints: { [SCREENS.md]: { slidesPerView: 3 } },
    })
  })

  it('is the grid without buttons when one view holds every teaser', async () => {
    const wrapper = await mountList(3)

    expect(started).toHaveLength(0)
    expect(wrapper.find('.is-slider-desktop').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('becomes a slider when the view gets narrower than its teasers', async () => {
    const wrapper = await mountList(3)

    viewport.isMdUpwards = false
    await flushPromises()

    expect(started).toHaveLength(1)
    expect(wrapper.findAll('button')).toHaveLength(2)

    viewport.isMdUpwards = true
    await flushPromises()

    expect(started[0]!.destroyed).toBe(true)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
