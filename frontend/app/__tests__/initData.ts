import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import useInitData from '../composables/useInitData'
import type { InitData } from '../composables/useInitData'

const { useDataCacheMock } = vi.hoisted(() => ({
  useDataCacheMock: vi.fn(),
}))

mockNuxtImport('useDataCache', () => useDataCacheMock)

function cachedInitData(): InitData {
  return {
    mainMenuLinks: [],
    footerMenuLinks: [],
    translations: {},
    globalConfig: {},
  }
}

describe('useInitData', () => {
  beforeEach(() => {
    clearNuxtState()
    useDataCacheMock.mockReset()
    // Every cache read returns a new copy, like a deserialized cache entry.
    useDataCacheMock.mockImplementation(() =>
      Promise.resolve({ value: cachedInitData(), addToCache: vi.fn() }),
    )
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
})
