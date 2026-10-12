import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TeaserList from '../components/Paragraph/TeaserList/index.vue'

const { list } = vi.hoisted(() => ({ list: { teaserStyle: 'grid' } }))

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ teaserStyle: list.teaserStyle, sliderStyle: 'stack' }),
}))

// Narrower than the slider breakpoint, so Swiper itself is never started.
mockNuxtImport('useViewport', () => () => ({
  isSmUpwards: computed(() => false),
  isMdUpwards: computed(() => false),
}))

async function mountList(teaserStyle: string) {
  list.teaserStyle = teaserStyle
  return mountSuspended(TeaserList, {
    props: { title: 'More news', paragraphs: [] },
    global: { stubs: { BlokkliField: true } },
  })
}

describe('teaser list as a slider', () => {
  beforeEach(() => {
    list.teaserStyle = 'grid'
  })

  it('has named previous and next buttons that are not a navigation landmark', async () => {
    const wrapper = await mountList('sliderDesktop')
    const buttons = wrapper.findAll('button')

    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual([
      'slides.prev',
      'slides.next',
    ])
    for (const button of buttons) {
      expect(button.attributes('type')).toBe('button')
    }
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  // Swiper starts at the sm breakpoint (shouldMountSwiper): from there on the
  // list can only be moved by its buttons or a swipe.
  it('shows the buttons from the width at which it becomes a slider', async () => {
    const wrapper = await mountList('sliderDesktop')
    const row = wrapper.get('button').element.closest('.hidden')

    expect(row?.classList.contains('sm:block')).toBe(true)
    expect(row?.classList.contains('md:block')).toBe(false)
  })

  it('has no buttons as a grid', async () => {
    const wrapper = await mountList('grid')

    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
