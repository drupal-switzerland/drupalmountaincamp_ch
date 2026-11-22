import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SponsorList from '../components/Paragraph/SponsorList/index.vue'

const TIERS = ['platinum', 'gold', 'silver', 'bronze', 'hosting']

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (_key: string, fallback: string) => fallback,
}))

mockNuxtImport('useAllSponsors', () => async () => ({
  sponsors: ref(
    TIERS.map((tier) => ({
      uuid: tier,
      title: `Sponsor ${tier}`,
      tier,
      year: 2027,
      link: { uri: { path: `https://${tier}.example.org/` } },
      logo: null,
    })),
  ),
}))

describe('sponsor list tile sizes', () => {
  it('shows each tier a size bigger than the footer', async () => {
    const wrapper = await mountSuspended(SponsorList, { props: { year: 2027 } })
    const widths = TIERS.map((tier) =>
      wrapper
        .find(`a[href="https://${tier}.example.org/"]`)
        .classes()
        .find((c) => c.startsWith('w-[')),
    )
    expect(widths).toEqual([
      'w-[360px]',
      'w-[320px]',
      'w-[280px]',
      'w-[240px]',
      'w-[240px]',
    ])
  })
})
