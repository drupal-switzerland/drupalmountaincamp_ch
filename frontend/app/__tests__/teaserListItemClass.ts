import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Teaser from '../components/Paragraph/Teaser/index.vue'

mockNuxtImport('defineBlokkli', () => () => ({}))

// The teaser list's staggered and slider rules select its items by this class.
describe('teaser in a teaser list', () => {
  it('carries the class the list styles select it by', async () => {
    const wrapper = await mountSuspended(Teaser, {
      props: {
        node: { url: { path: '/news/a' }, teaserTitle: 'An article' },
      } as never,
    })

    expect(wrapper.classes()).toContain('paragraph-teaser')
  })
})

// The card has its own gradient frame; a second border around it doubled it.
// Without a card the box renders only while editing, which keeps a border;
// the test build cannot switch editing on.
describe('teaser frame', () => {
  it('has no border of its own around a card', async () => {
    const withCard = await mountSuspended(Teaser, {
      props: {
        node: { url: { path: '/news/a' }, teaserTitle: 'An article' },
      } as never,
    })

    expect(withCard.classes()).not.toContain('border')
  })
})
