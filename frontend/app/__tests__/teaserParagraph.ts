import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Teaser from '../components/Paragraph/Teaser/index.vue'

mockNuxtImport('defineBlokkli', () => () => ({}))

describe('teaser paragraph', () => {
  it('renders its bordered box with a link to a node', async () => {
    const wrapper = await mountSuspended(Teaser, {
      props: {
        node: { url: { path: '/news/a' }, teaserTitle: 'An article' },
      } as never,
    })

    expect(wrapper.find('.border').exists()).toBe(true)
    expect(wrapper.text()).toContain('An article')
  })

  // An unpublished or deleted node comes without a URL and a title.
  it('renders nothing when the node has no URL or title', async () => {
    for (const node of [
      undefined,
      { url: null, teaserTitle: 'An article' },
      { url: { path: '/a' }, teaserTitle: '' },
    ]) {
      const wrapper = await mountSuspended(Teaser, { props: { node } as never })

      expect(wrapper.find('.border').exists()).toBe(false)
    }
  })
})
