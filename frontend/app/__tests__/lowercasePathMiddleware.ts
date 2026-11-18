import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'
import lowercasePathMiddleware, {
  lowercasePath,
} from '../middleware/lowercase-path.global'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

function visit(
  path: string,
  query: RouteLocationNormalized['query'] = {},
  hash = '',
) {
  const to = { path, query, hash } as RouteLocationNormalized
  return lowercasePathMiddleware(to, to)
}

describe('lowercase path middleware', () => {
  beforeEach(() => {
    navigateToMock.mockReset()
  })

  it('redirects /News to /news with a 301, keeping query and hash', () => {
    visit('/News', { page: '2' }, '#top')

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: '/news', query: { page: '2' }, hash: '#top' },
      { redirectCode: 301 },
    )
  })

  it.each([
    ['/NEWS/Some-Article', '/news/some-article'],
    ['/Home', '/home'],
    ['/%C3%BCber-Uns', '/%C3%BCber-uns'],
  ])('redirects %s to %s', (from, to) => {
    visit(from)

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: to, query: {}, hash: '' },
      { redirectCode: 301 },
    )
  })

  it.each(['/', '/news', '/news/some-article', '/%C3%BCber-uns', '/node/5'])(
    'lets %s through',
    (path) => {
      expect(visit(path, { blokkliEdit: 'ABC' })).toBeUndefined()
      expect(navigateToMock).not.toHaveBeenCalled()
    },
  )

  it('leaves percent-escapes untouched', () => {
    expect(lowercasePath('/A%2Fb%C3%A4')).toBe('/a%2Fb%C3%A4')
  })
})
