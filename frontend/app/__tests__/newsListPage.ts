import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { renderDOMHead } from 'unhead/client'
import NewsPage from '../pages/news/index.vue'

const PAGE_SIZE = 10

// The app itself queries Drupal while it starts (init data, the user), before
// any test has said what Drupal answers.
const { query } = vi.hoisted(() => ({
  query: vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (..._args: any[]): Promise<any> => ({ data: {} }),
  ),
}))

mockNuxtImport('useGraphqlQuery', () => query)
mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const Teaser = defineComponent({
  inheritAttrs: false,
  props: {
    title: { type: String, default: '' },
    preload: { type: Boolean, default: false },
  },
  setup: (props) => () =>
    h('article', { 'data-preload': String(props.preload) }, props.title),
})

// Rendered as nothing: only the list matters here.
const Nothing = defineComponent({ inheritAttrs: false, render: () => null })

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
const mounted: Wrapper[] = []

async function mountNews(route: string) {
  const wrapper = await mountSuspended(NewsPage, {
    route,
    global: {
      stubs: {
        PageHero: Nothing,
        Pagination: Nothing,
        NodePressReleaseTeaser: Teaser,
      },
    },
  })
  mounted.push(wrapper)
  return wrapper
}

function articles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    uuid: `uuid-${i}`,
    title: `Article ${i + 1}`,
  }))
}

// Answers the two queries the page makes: its own route and the list.
function drupal(options: {
  total?: number
  items?: unknown[]
  listFails?: boolean
}) {
  query.mockImplementation((name: string) => {
    if (name === 'newsOverview') {
      return Promise.resolve({ data: { route: { entity: { title: 'News' } } } })
    }
    if (options.listFails) {
      return Promise.reject(createError({ statusCode: 503 }))
    }
    return Promise.resolve({
      data: {
        entityQuery: { total: options.total ?? 0, items: options.items ?? [] },
      },
    })
  })
}

function listRequests() {
  return query.mock.calls
    .filter(([name]) => name === 'newsList')
    .map(([, variables]) => variables)
}

describe('news list page', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    clearError()
    query.mockReset()
  })

  afterEach(() => {
    mounted.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('shows the first ten articles on /news', async () => {
    drupal({ total: 12, items: [...articles(3), null] })

    const wrapper = await mountNews('/news')

    expect(wrapper.findAll('article').map((a) => a.text())).toEqual([
      'Article 1',
      'Article 2',
      'Article 3',
    ])
    expect(listRequests()).toEqual([{ limit: PAGE_SIZE, offset: 0 }])
    expect(useError().value).toBeFalsy()
  })

  it('advertises the news feed by absolute URL', async () => {
    drupal({ total: 1, items: articles(1) })

    await mountNews('/news')

    renderDOMHead(await useNuxtApp().runWithContext(() => injectHead()))

    const feed = document.head.querySelector('link[rel="alternate"]')
    expect(feed?.getAttribute('type')).toBe('application/rss+xml')
    expect(feed?.getAttribute('href')).toMatch(
      /^https?:\/\/[^/]+\/news\/planet_drupal\.xml$/,
    )
  })

  it('marks only the first article for an eager image', async () => {
    drupal({ total: 3, items: articles(3) })

    const wrapper = await mountNews('/news')

    expect(
      wrapper.findAll('article').map((el) => el.attributes('data-preload')),
    ).toEqual(['true', 'false', 'false'])
  })

  it('asks for the second ten on ?page=2', async () => {
    drupal({ total: 12, items: articles(2) })

    await mountNews('/news?page=2')

    expect(listRequests()).toEqual([{ limit: PAGE_SIZE, offset: PAGE_SIZE }])
  })

  it('is a 404 for a page after the last one', async () => {
    drupal({ total: 12, items: [] })

    await mountNews('/news?page=3').catch(() => {})

    expect(useError().value).toMatchObject({ statusCode: 404, fatal: true })
  })

  it('shows the last page, which is not a 404', async () => {
    drupal({ total: 12, items: articles(2) })

    const wrapper = await mountNews('/news?page=2')

    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(useError().value).toBeFalsy()
  })

  it('says the news could not be loaded when the list request fails, and is not a 404', async () => {
    drupal({ listFails: true })

    const wrapper = await mountNews('/news?page=2')

    expect(wrapper.text()).toContain('news.loadError')
    expect(wrapper.findAll('article')).toHaveLength(0)
    expect(useError().value).toBeFalsy()
  })

  it('shows no error text when the list loads', async () => {
    drupal({ total: 1, items: articles(1) })

    const wrapper = await mountNews('/news')

    expect(wrapper.text()).not.toContain('news.loadError')
  })

  it('never asks Drupal for an offset beyond the allowed range', async () => {
    drupal({ total: 12, items: [] })

    await mountNews('/news?page=999999999').catch(() => {})

    expect(listRequests()).toEqual([])
    expect(useError().value).toMatchObject({ statusCode: 404 })
  })
})
