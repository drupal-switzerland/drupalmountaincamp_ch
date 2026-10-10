import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useInitData from '../composables/useInitData'
import type { InitData } from '../composables/useInitData'

function cachedInitData(): InitData {
  return {
    mainMenuLinks: [],
    footerMenuLinks: [],
    translations: {},
    globalConfig: {},
  }
}

// Every cache read returns a new copy, like a deserialized cache entry.
function readCache() {
  return Promise.resolve({ value: cachedInitData(), addToCache: () => {} })
}

const { useDataCacheMock, useGraphqlQueryMock } = vi.hoisted(() => ({
  useDataCacheMock: vi.fn(),
  useGraphqlQueryMock: vi.fn(),
}))

mockNuxtImport('useDataCache', () => useDataCacheMock)
mockNuxtImport('useGraphqlQuery', () => useGraphqlQueryMock)
// The easy texts plugin loads init data while the test app starts.
useDataCacheMock.mockImplementation(readCache)

describe('useInitData', () => {
  beforeEach(() => {
    clearNuxtState()
    useDataCacheMock.mockClear()
    useDataCacheMock.mockImplementation(readCache)
    useGraphqlQueryMock.mockReset()
  })

  it('keeps the same data for every call in one render', async () => {
    const first = (await useInitData()).value
    const second = (await useInitData()).value

    expect(second).toBe(first)
    expect(useDataCacheMock).toHaveBeenCalledTimes(1)
  })

  it('uses the hydrated state without reading the cache', async () => {
    const hydrated = cachedInitData()
    useState<InitData>('initData').value = hydrated

    expect((await useInitData()).value).toStrictEqual(hydrated)
    expect(useDataCacheMock).not.toHaveBeenCalled()
  })

  function missCache() {
    useDataCacheMock.mockImplementation(() =>
      Promise.resolve({ value: undefined, addToCache: () => {} }),
    )
  }

  it('reads the cache entry of the current language', async () => {
    await useInitData()

    expect(useDataCacheMock.mock.calls[0]![0]).toBe('initData_en')
  })

  it('loads menus, config and texts from Drupal on a cache miss', async () => {
    missCache()
    const mainLinks = [{ link: { label: 'Program' } }]
    const footerLinks = [{ link: { label: 'Team' } }]
    useGraphqlQueryMock.mockResolvedValue({
      data: {
        mainMenu: { links: mainLinks },
        footerMenu: { links: footerLinks },
        globalConfig: { address: 'Davos' },
        translations: {
          menu: 'Menu',
          edition__dates: 'March 2–4, 2027',
          news__count: { singular: '1 article', plural: '@count articles' },
          broken__plural: { singular: 'only one form' },
        },
      },
    })

    const initData = (await useInitData()).value

    expect(initData.mainMenuLinks).toEqual(mainLinks)
    expect(initData.footerMenuLinks).toEqual(footerLinks)
    expect(initData.globalConfig).toEqual({ address: 'Davos' })
    expect(initData.translations).toEqual({
      menu: 'Menu',
      'edition.dates': 'March 2–4, 2027',
      'news.count': ['1 article', '@count articles'],
    })
  })

  it('asks Drupal for the current language, marked as a server request', async () => {
    missCache()
    useGraphqlQueryMock.mockResolvedValue({ data: {} })

    await useInitData()

    const request = useGraphqlQueryMock.mock.calls[0]![0]
    expect(request.name).toBe('initData')
    expect(request.fetchOptions.query).toEqual({
      language: 'en',
      __server: 'true',
    })
  })

  it('renders without menus instead of failing when Drupal is down', async () => {
    missCache()
    const failure = new Error('503')
    useGraphqlQueryMock.mockRejectedValue(failure)
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})

    const initData = (await useInitData()).value

    expect(initData.mainMenuLinks).toEqual([])
    expect(initData.footerMenuLinks).toEqual([])
    expect(initData.globalConfig).toEqual({})
    expect(logged).toHaveBeenCalledWith(expect.any(String), failure)
    logged.mockRestore()
  })

  it('renders without menus when Drupal answers without them', async () => {
    missCache()
    useGraphqlQueryMock.mockResolvedValue({ data: {} })

    const initData = (await useInitData()).value

    expect(initData).toEqual({
      mainMenuLinks: [],
      footerMenuLinks: [],
      globalConfig: {},
      translations: {},
    })
  })
})
