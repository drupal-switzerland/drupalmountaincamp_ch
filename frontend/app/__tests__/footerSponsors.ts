import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import PageFooter from '../components/PageFooter/index.vue'
import { SPONSOR_YEAR } from '../helpers/sponsors'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport('useInitData', () => async () => ref({ footerMenuLinks: [] }))

mockNuxtImport('useTicketsLink', () => async () => ref(null))

const TIERS = ['platinum', 'gold', 'silver', 'bronze']

mockNuxtImport('useCurrentSponsors', () => async () => ({
  currentByTier: ref(
    Object.fromEntries(
      ['platinum', 'gold', 'silver', 'bronze'].map((tier) => [
        tier,
        [
          {
            uuid: tier,
            title: `Sponsor ${tier}`,
            tier,
            year: SPONSOR_YEAR,
            link: { uri: { path: `https://${tier}.example.org/` } },
            logo: null,
          },
        ],
      ]),
    ),
  ),
}))

describe('footer sponsors', () => {
  it('shows every paid tier in order, Bronze included', async () => {
    const wrapper = await mountSuspended(PageFooter)
    const headings = wrapper
      .findAll('h3')
      .map((h) => h.text())
      .filter((text) => text.startsWith('sponsors.'))
    expect(headings).toEqual(TIERS.map((tier) => `sponsors.${tier}`))
    expect(wrapper.text()).toContain('Sponsor bronze')
  })

  it('gives each tier a smaller tile than the one above', async () => {
    const wrapper = await mountSuspended(PageFooter)
    const widths = TIERS.map((tier) =>
      wrapper
        .find(`a[href="https://${tier}.example.org/"]`)
        .classes()
        .find((c) => c.startsWith('w-[')),
    )
    expect(widths).toEqual(['w-[280px]', 'w-[240px]', 'w-[200px]', 'w-[160px]'])
  })
})
