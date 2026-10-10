import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import {
  setBreadcrumbLinks,
  setBreadcrumbLinksFromRoute,
  useBreadcrumbLinks,
} from '../composables/breadcrumb'
import { setLanguageLinksFromRoute } from '../composables/languageLinks'
import useSiteOrigin from '../composables/useSiteOrigin'

const { defineLinks } = vi.hoisted(() => ({ defineLinks: vi.fn() }))

mockNuxtImport('definePageLanguageLinks', () => defineLinks)

type RouteQuery = Parameters<typeof setBreadcrumbLinksFromRoute>[0]

function routeQuery(route: Record<string, unknown> | null) {
  return { route } as unknown as RouteQuery
}

const home = { title: 'Home', url: { path: '/' } }
const news = { title: 'News', url: { path: '/news' } }

describe('breadcrumb links', () => {
  beforeEach(() => {
    clearNuxtState()
  })

  it('come from the route Drupal resolved', () => {
    setBreadcrumbLinksFromRoute(routeQuery({ breadcrumb: [home, news] }))

    expect(useBreadcrumbLinks().value).toEqual([home, news])
  })

  it.each([
    ['a route without a breadcrumb', routeQuery({ path: '/x' })],
    ['a route with an empty breadcrumb', routeQuery({ breadcrumb: null })],
    ['no route', routeQuery(null)],
    ['no query', null],
  ])("are cleared for %s, so the previous page's don't stay", (_l, query) => {
    setBreadcrumbLinksFromRoute(routeQuery({ breadcrumb: [home, news] }))

    setBreadcrumbLinksFromRoute(query)

    expect(useBreadcrumbLinks().value).toEqual([])
  })

  it('can be set directly, and cleared with nothing', () => {
    setBreadcrumbLinks([home])
    expect(useBreadcrumbLinks().value).toEqual([home])

    setBreadcrumbLinks(null)
    expect(useBreadcrumbLinks().value).toEqual([])
  })
})

describe('language links', () => {
  beforeEach(() => {
    defineLinks.mockReset()
  })

  function link(id: string | null, path: string | null) {
    return { language: { id }, url: { path } }
  }

  it('map each language to the path of its translation', () => {
    setLanguageLinksFromRoute(
      routeQuery({
        languageSwitchLinks: [link('en', '/news'), link('de', '/de/aktuell')],
      }),
    )

    expect(defineLinks).toHaveBeenCalledExactlyOnceWith({
      en: '/news',
      de: '/de/aktuell',
    })
  })

  it('leave out a language without an id or without a path', () => {
    setLanguageLinksFromRoute(
      routeQuery({
        languageSwitchLinks: [
          link('en', '/news'),
          link(null, '/x'),
          link('fr', null),
        ],
      }),
    )

    expect(defineLinks).toHaveBeenCalledExactlyOnceWith({ en: '/news' })
  })

  it.each([
    ['a route without language links', routeQuery({ path: '/x' })],
    ['no route', routeQuery(null)],
    ['no query', undefined],
  ])("are cleared for %s, so the previous page's don't stay", (_l, query) => {
    setLanguageLinksFromRoute(query)

    expect(defineLinks).toHaveBeenCalledExactlyOnceWith({})
  })
})

describe('site origin', () => {
  beforeEach(() => {
    clearNuxtState()
  })

  it('keeps the origin the server resolved and sent in the payload', () => {
    useState('siteOrigin').value = 'https://drupalmountaincamp.ch'

    expect(useSiteOrigin().value).toBe('https://drupalmountaincamp.ch')
  })

  it('falls back to the origin of the request', () => {
    expect(useSiteOrigin().value).toBe(useRequestURL().origin)
    expect(useSiteOrigin().value).toMatch(/^https?:\/\/[^/]+$/)
  })
})
