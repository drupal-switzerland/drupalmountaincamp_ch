import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import TeaserList from '../components/Paragraph/TeaserList/index.vue'

const { LOAD_ERROR } = vi.hoisted(() => ({
  LOAD_ERROR: 'chunk failed to load',
}))

// Swiper is loaded on demand, and that request can fail like any other.
vi.mock('../helpers/swiper', () => ({
  loadSwiper: async () => {
    throw new Error(LOAD_ERROR)
  },
}))

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({ teaserStyle: 'sliderDesktop', sliderStyle: 'stack' }),
}))

// Wide enough for the list to start Swiper.
mockNuxtImport('useViewport', () => () => ({
  isSmUpwards: computed(() => true),
  isMdUpwards: computed(() => true),
}))

describe('teaser list when its slider cannot be started', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs the failure and stays the grid, without buttons', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = await mountSuspended(TeaserList, {
      // More teasers than one view holds, so the list tries to start.
      props: {
        title: 'More news',
        paragraphs: [1, 2, 3, 4].map((i) => ({ uuid: `teaser-${i}` })) as never,
      },
      global: { stubs: { BlokkliField: true } },
    })
    await flushPromises()

    expect(logged).toHaveBeenCalled()
    for (const [message] of logged.mock.calls) {
      expect(message).toContain('teaser slider could not be started')
    }
    expect(
      logged.mock.calls.map(
        ([, error]) => (error as Error | undefined)?.message,
      ),
    ).toContain(LOAD_ERROR)
    expect(wrapper.find('h2').text()).toBe('More news')
    expect(wrapper.find('.is-slider-desktop').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(0)
    wrapper.unmount()
  })
})
