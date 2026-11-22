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

describe('sponsor list panels', () => {
  it('shows Platinum largest, then Gold and Silver, then the rest', async () => {
    const wrapper = await mountSuspended(SponsorList, { props: { year: 2027 } })
    const widths = TIERS.map((tier) =>
      wrapper
        .find(`a[href="https://${tier}.example.org/"]`)
        .classes()
        .find((c) => c.startsWith('w-[')),
    )
    expect(widths).toEqual([
      'w-[320px]',
      'w-[250px]',
      'w-[250px]',
      'w-[190px]',
      'w-[190px]',
    ])
  })

  it('ends each sellable tier with one open spot in the current year', async () => {
    const wrapper = await mountSuspended(SponsorList, { props: { year: 2027 } })
    // Texts are mocked away; the counts show which spots are left.
    const open = wrapper
      .findAll('a[href="/sponsorship"]')
      .map((a) => a.text().match(/\d+/g)?.join('/') ?? '')
    expect(open).toEqual(['2/3', '4/5', '7/8', '', ''])
  })

  it('shows no open spots or CTA for another year', async () => {
    const wrapper = await mountSuspended(SponsorList, { props: { year: 2026 } })
    expect(wrapper.findAll('a[href="/sponsorship"]')).toHaveLength(0)
  })
})
