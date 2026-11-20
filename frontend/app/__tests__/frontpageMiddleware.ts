import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'
import frontpage from '../middleware/frontpage.global'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

function visit(path: string, query: RouteLocationNormalized['query'] = {}) {
  const to = { path, query } as RouteLocationNormalized
  return frontpage(to, to)
}

describe('frontpage middleware', () => {
  beforeEach(() => {
    navigateToMock.mockReset()
  })

  it('redirects /home to / with a 301', () => {
    visit('/home')

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: '/', query: {} },
      { redirectCode: 301 },
    )
  })

  it('keeps the query string', () => {
    visit('/home', { blokkliEdit: 'abc', lang: 'en' })

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: '/', query: { blokkliEdit: 'abc', lang: 'en' } },
      { redirectCode: 301 },
    )
  })

  it.each(['/', '/news', '/home/sub', '/homepage', '/Home'])(
    'lets %s through',
    (path) => {
      expect(visit(path, { a: '1' })).toBeUndefined()
      expect(navigateToMock).not.toHaveBeenCalled()
    },
  )
})
