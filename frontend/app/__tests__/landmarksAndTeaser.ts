import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import GlobalMenu from '../components/PageHeader/GlobalMenu.vue'
import Card from '../components/Node/PressRelease/Card/index.vue'

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

describe('news card on /news', () => {
  const props = {
    uuid: 'a',
    title: 'Sponsorship is open',
    url: { path: '/news/sponsorship-is-open' },
    date: { formatted: '8. October 2026' },
    teaser: '<p>Be part of Mountain Camp 2027.</p>',
    headingTag: 'h2' as const,
  }

  it('names its link by the article title only', async () => {
    const wrapper = await mountSuspended(Card, { props })
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(1)
    expect(links[0]!.text()).toBe('Sponsorship is open')
    expect(links[0]!.attributes('href')).toBe('/news/sponsorship-is-open')
    expect(links[0]!.element.closest('h2')).not.toBeNull()
  })

  it('loads its image lazily unless it is the preloaded card', async () => {
    const image = {
      image: {
        wide: {
          urlPath: '/sites/default/files/a.webp',
          width: 1090,
          height: 600,
        },
      },
    }
    const lazy = await mountSuspended(Card, { props: { ...props, image } })
    const eager = await mountSuspended(Card, {
      props: { ...props, image, preload: true },
    })

    expect(lazy.get('img').attributes('loading')).toBe('lazy')
    expect(lazy.get('img').attributes('fetchpriority')).toBeUndefined()
    expect(eager.get('img').attributes('loading')).toBe('eager')
    expect(eager.get('img').attributes('fetchpriority')).toBe('high')
  })

  it('gives its image the sizes of the list that holds it', async () => {
    const image = {
      image: {
        large: {
          urlPath: '/sites/default/files/s.webp',
          width: 480,
          height: 264,
        },
        wide: {
          urlPath: '/sites/default/files/a.webp',
          width: 1090,
          height: 600,
        },
      },
    }
    const inList = await mountSuspended(Card, {
      props: {
        ...props,
        image,
        imageSizes: '(min-width: 1024px) 20rem, 100vw',
      },
    })
    const alone = await mountSuspended(Card, { props: { ...props, image } })

    expect(inList.get('img').attributes('sizes')).toBe(
      '(min-width: 1024px) 20rem, 100vw',
    )
    expect(alone.get('img').attributes('sizes')).toBe(
      '(min-width: 728px) 728px, 100vw',
    )
  })

  it('keeps date and teaser in the article, outside the link', async () => {
    const wrapper = await mountSuspended(Card, { props })
    const article = wrapper.get('article')

    expect(article.element.closest('a')).toBeNull()
    expect(article.text()).toContain('8. October 2026')
    expect(article.text()).toContain('Be part of Mountain Camp 2027.')
    expect(wrapper.get('a').text()).not.toContain('8. October 2026')
  })

  it('makes the whole card clickable through the link', async () => {
    const wrapper = await mountSuspended(Card, { props })

    expect(wrapper.get('article').classes()).toContain('relative')
    expect(wrapper.get('a').classes()).toEqual(
      expect.arrayContaining(['after:absolute', 'after:inset-0']),
    )
  })

  // The card-wide ::after has no z-index of its own, so it cannot rise above
  // the sticky header.
  it('keeps the card-wide link below the sticky header', async () => {
    const wrapper = await mountSuspended(Card, { props })

    expect(
      wrapper
        .get('a')
        .classes()
        .filter((name) => /z-/.test(name)),
    ).toEqual([])
  })
})
