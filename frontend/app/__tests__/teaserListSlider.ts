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

async function mountList(teaserStyle: string, title = 'More news') {
  list.teaserStyle = teaserStyle
  return mountSuspended(TeaserList, {
    props: { title, paragraphs: [] },
    global: { stubs: { BlokkliField: true } },
  })
}

describe('teaser list', () => {
  it('has a heading only for a title with text', async () => {
    const headings = async (title: string) =>
      (await mountList('grid', title)).findAll('h2').length

    expect(await headings('More news')).toBe(1)
    expect(await headings('')).toBe(0)
    expect(await headings('  \n')).toBe(0)
  })
})

// The slider style below the slider width: Swiper never starts here.
describe('teaser list in the slider style without a running slider', () => {
  beforeEach(() => {
    list.teaserStyle = 'grid'
  })

  it('is the grid, without previous and next buttons', async () => {
    const wrapper = await mountList('sliderDesktop')

    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.find('.is-slider-desktop').exists()).toBe(false)
  })

  it('has no buttons as a grid', async () => {
    const wrapper = await mountList('grid')

    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
