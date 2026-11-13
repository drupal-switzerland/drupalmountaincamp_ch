import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TeaserDefault from '../components/Teaser/Default/index.vue'

const HOVER_PREFIX = '[.teaser:hover_&]:'
const FOCUS_PREFIX = 'group-focus-visible:'

describe('Teaser arrow (WCAG 1.4.13)', () => {
  it('shows on keyboard focus of the link wherever it shows on hover', async () => {
    const wrapper = await mountSuspended(TeaserDefault, {
      props: { title: 'Teaser', to: '/news/one' },
    })
    const link = wrapper.get('a')
    const arrow = link.get('svg')
    const classes = arrow.classes()
    const hoverStates = classes
      .filter((name) => name.startsWith(HOVER_PREFIX))
      .map((name) => name.slice(HOVER_PREFIX.length))

    expect(link.classes()).toContain('group')
    expect(hoverStates.length).toBeGreaterThan(0)
    for (const state of hoverStates) {
      expect(classes).toContain(FOCUS_PREFIX + state)
    }
  })
})
