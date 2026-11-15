import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import PageFooter from '../components/PageFooter/index.vue'
import { defaultLinkTarget } from '../helpers/navigation'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const footerLink = (label: string, path: string) => ({
  link: { label, url: { path } },
  subtree: [],
})

mockNuxtImport(
  'useInitData',
  () => async () =>
    ref({
      footerMenuLinks: [
        footerLink('Contact', 'mailto:info@example.org'),
        footerLink('Slack', 'https://join.slack.com/t/drupal-switzerland'),
        footerLink('Imprint', '/imprint'),
      ],
    }),
)

mockNuxtImport('useCurrentSponsors', () => async () => ({
  currentByTier: ref({ media: [] }),
}))

mockNuxtImport('useTicketsLink', () => async () => ref(null))

describe('defaultLinkTarget', () => {
  it('opens web URLs in a new tab and the rest in the same one', () => {
    expect(defaultLinkTarget('https://drupal.ch')).toBe('_blank')
    expect(defaultLinkTarget('mailto:info@example.org')).toBe('_self')
    expect(defaultLinkTarget('tel:+41000000000')).toBe('_self')
    expect(defaultLinkTarget('/imprint')).toBe('_self')
  })
})

describe('footer navigation', () => {
  const linkNamed = async (label: string) => {
    const wrapper = await mountSuspended(PageFooter)
    const link = wrapper
      .get('nav')
      .findAll('a')
      .find((a) => a.text().startsWith(label))
    if (!link) {
      throw new Error(`No footer link ${label}`)
    }
    return link
  }

  it('tells that an external link opens a new tab', async () => {
    const link = await linkNamed('Slack')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.get('.sr-only').text()).toBe('(newTabHint)')
  })

  it('keeps the mail link in the tab, without the hint', async () => {
    const link = await linkNamed('Contact')
    expect(link.attributes('target')).not.toBe('_blank')
    expect(link.find('.sr-only').exists()).toBe(false)
  })

  it('gives internal links no hint', async () => {
    const link = await linkNamed('Imprint')
    expect(link.attributes('target')).not.toBe('_blank')
    expect(link.find('.sr-only').exists()).toBe(false)
  })
})
