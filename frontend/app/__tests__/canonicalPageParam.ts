import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { RouteLocationNormalized } from 'vue-router'
import canonicalPageParam from '../middleware/canonical-page-param'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

function visit(
  path: string,
  query: RouteLocationNormalized['query'],
  hash = '',
) {
  const to = { path, query, hash } as RouteLocationNormalized
  return canonicalPageParam(to, to)
}

describe('canonical-page-param middleware', () => {
  beforeEach(() => {
    navigateToMock.mockReset()
  })

  it('redirects a non-canonical page to its canonical URL with a 301', () => {
    visit('/news', { page: '02', topic: 'drupal' }, '#list')

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: '/news', query: { page: '2', topic: 'drupal' }, hash: '#list' },
      { redirectCode: 301 },
    )
  })

  it('drops page=1', () => {
    visit('/news', { page: '1' })

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: '/news', query: {}, hash: '' },
      { redirectCode: 301 },
    )
  })

  it.each<RouteLocationNormalized['query']>([
    {},
    { page: '2' },
    { topic: 'drupal' },
  ])('lets canonical URLs through: %j', (query) => {
    expect(visit('/news', query)).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
