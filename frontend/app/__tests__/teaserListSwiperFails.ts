import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import TeaserList from '../components/Paragraph/TeaserList/index.vue'

// Swiper is loaded on demand, and that request can fail like any other. The
// list asks for it twice (on mount and when its container is set). In the
// full suite the second import gets the real Swiper, which cannot start in a
// test DOM without layout: that is a failed start as well.
vi.mock('swiper', () => ({
  get default() {
    throw new Error('chunk failed to load')
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

  it('logs the failure and stays on the page', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = await mountSuspended(TeaserList, {
      props: { title: 'More news', paragraphs: [] },
      global: { stubs: { BlokkliField: true } },
    })
    await flushPromises()

    expect(logged).toHaveBeenCalled()
    for (const [message] of logged.mock.calls) {
      expect(message).toContain('teaser slider could not be started')
    }
    expect(wrapper.find('h2').text()).toBe('More news')
    await wrapper.findAll('button')[1]!.trigger('click')
    wrapper.unmount()
  })
})
