import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GlobalMenu from '../components/PageHeader/GlobalMenu.vue'
import Teaser from '../components/Node/PressRelease/Teaser/index.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

mockNuxtImport(
  'useInitData',
  () => async () =>
    ref({
      mainMenuLinks: [
        { link: { label: 'Program', url: { path: '/program' } }, subtree: [] },
        { link: { label: 'Tickets', url: { path: '/tickets' } }, subtree: [] },
      ],
    }),
)

describe('main navigation', () => {
  it('has an accessible name', async () => {
    const wrapper = await mountSuspended(GlobalMenu)

    expect(wrapper.get('nav').attributes('aria-label')).toBe('mainNavigation')
  })
})

describe('news teaser', () => {
  const props = {
    uuid: 'a',
    title: 'Sponsorship is open',
    url: { path: '/news/sponsorship-is-open' },
    date: { formatted: '8. October 2026' },
    teaser: '<p>Be part of Mountain Camp 2027.</p>',
  }

  it('names its link by the article title only', async () => {
    const wrapper = await mountSuspended(Teaser, { props })
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(1)
    expect(links[0]!.text()).toBe('Sponsorship is open')
    expect(links[0]!.attributes('href')).toBe('/news/sponsorship-is-open')
    expect(links[0]!.element.closest('h2')).not.toBeNull()
  })

  it('keeps date and teaser in the article, outside the link', async () => {
    const wrapper = await mountSuspended(Teaser, { props })
    const article = wrapper.get('article')

    expect(article.element.closest('a')).toBeNull()
    expect(article.text()).toContain('8. October 2026')
    expect(article.text()).toContain('Be part of Mountain Camp 2027.')
    expect(wrapper.get('a').text()).not.toContain('8. October 2026')
  })

  it('makes the whole card clickable through the link', async () => {
    const wrapper = await mountSuspended(Teaser, { props })

    expect(wrapper.get('article').classes()).toContain('relative')
    expect(wrapper.get('a').classes()).toEqual(
      expect.arrayContaining(['after:absolute', 'after:inset-0']),
    )
  })
})
