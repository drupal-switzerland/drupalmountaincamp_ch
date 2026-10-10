import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, type Component } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import SlugPage from '../pages/[...slug]/index.vue'
import HomePage from '../pages/index.vue'
import NewsArticlePage from '../pages/news/[...slug]/index.vue'
import NodePage from '../pages/node/[nid]/index.vue'

const { query, navigate } = vi.hoisted(() => ({
  query: vi.fn(),
  navigate: vi.fn(),
}))

mockNuxtImport('useGraphqlQuery', () => query)
mockNuxtImport('navigateTo', () => navigate)

// Each node component is replaced by a marker that shows which one rendered
// and with which title.
function marker(name: string) {
  return defineComponent({
    inheritAttrs: false,
    props: { title: { type: String, default: '' } },
    setup: (props) => () => h('div', { 'data-rendered': name }, props.title),
  })
}

const stubs = {
  NodePage: marker('NodePage'),
  NodePageLanding: marker('NodePageLanding'),
  NodePressRelease: marker('NodePressRelease'),
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
const mounted: Wrapper[] = []

async function mountPage(page: Component) {
  const wrapper = await mountSuspended(page, { global: { stubs } })
  mounted.push(wrapper)
  return wrapper
}

// Unmounted before the next test clears the route data they still read.
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount())
})

function found(typename: string, entity: Record<string, unknown> = {}) {
  return {
    data: {
      route: {
        entity: { title: 'A title', ...entity },
        entityGlobal: { __typename: typename },
      },
    },
  }
}

const notFound = { data: { route: null } }

function drupalDown() {
  return Promise.reject(
    createError({ statusCode: 503, statusMessage: 'Service Unavailable' }),
  )
}

// A page that throws in setup doesn't reject the mount: Nuxt catches the
// error and keeps it as the app's error, which is what the error page shows.
async function errorOf(page: Component) {
  await mountPage(page).catch(() => {})
  return useError().value
}

const pages: [string, Component, string][] = [
  ['the home page', HomePage, 'NodePageLanding'],
  ['a content page', SlugPage, 'NodePage'],
  ['a news article', NewsArticlePage, 'NodePressRelease'],
  ['/node/<nid>', NodePage, 'NodePage'],
]

describe('route pages', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    query.mockReset()
    navigate.mockReset()
  })

  it.each(pages)(
    '%s renders the node Drupal resolved',
    async (_n, page, as) => {
      query.mockResolvedValue(found(as))

      const wrapper = await mountPage(page)

      expect(wrapper.get(`[data-rendered="${as}"]`).text()).toBe('A title')
    },
  )

  it.each(pages)(
    '%s is a 404 when Drupal has no such route',
    async (_n, page) => {
      query.mockResolvedValue(notFound)

      expect(await errorOf(page)).toMatchObject({
        statusCode: 404,
        fatal: true,
      })
    },
  )

  it.each(pages)(
    '%s keeps the 503 when Drupal is down, not a 404',
    async (_n, page) => {
      query.mockImplementation(drupalDown)

      expect(await errorOf(page)).toMatchObject({
        statusCode: 503,
        fatal: true,
      })
    },
  )

  it.each(pages)('%s follows a redirect from Drupal', async (_n, page) => {
    query.mockResolvedValue({
      data: { route: { path: '/new-path', redirect: { statusCode: 302 } } },
    })

    await mountPage(page)

    expect(navigate).toHaveBeenCalledOnce()
    const [target, options] = navigate.mock.calls[0]!
    expect(target.path).toBe('/new-path')
    expect(options.redirectCode).toBe(302)
  })
})

describe('content page', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    query.mockReset()
  })

  it('renders the landing layout for a page with a hero image', async () => {
    query.mockResolvedValue(found('NodePage', { hero: { image: {} } }))

    const wrapper = await mountPage(SlugPage)

    expect(wrapper.find('[data-rendered="NodePageLanding"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('[data-rendered="NodePage"]').exists()).toBe(false)
  })
})

describe('/node/<nid>', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    query.mockReset()
  })

  it('renders a press release with the press release component', async () => {
    query.mockResolvedValue(found('NodePressRelease'))

    const wrapper = await mountPage(NodePage)

    expect(wrapper.find('[data-rendered="NodePressRelease"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('[data-rendered="NodePage"]').exists()).toBe(false)
  })

  it('renders nothing for a node type it has no component for', async () => {
    query.mockResolvedValue(found('NodeSponsor'))

    const wrapper = await mountPage(NodePage)

    expect(wrapper.find('[data-rendered]').exists()).toBe(false)
  })
})

describe('home page', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    query.mockReset()
  })

  it('asks Drupal for the /home alias, not for "/"', async () => {
    query.mockResolvedValue(found('NodePage'))

    await mountPage(HomePage)

    expect(query).toHaveBeenCalledWith('route', { path: '/home' })
  })
})
