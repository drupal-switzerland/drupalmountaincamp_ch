import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import defineAdapter from '../vuepal.adapter'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))

mockNuxtImport('useGraphqlQuery', () => query)

type Adapter = {
  getAdminMenu: () => Promise<unknown>
  getLocalTasks: (path: string) => Promise<unknown>
  getCurrentLanguage: () => { value: string }
}

const adapter = () => (defineAdapter as unknown as () => Adapter)()

describe('vuepal adapter', () => {
  beforeEach(() => {
    query.mockReset()
  })

  it('loads the admin menu', async () => {
    query.mockResolvedValue({ data: { menu: ['Content'] } })

    await expect(adapter().getAdminMenu()).resolves.toEqual({
      menu: ['Content'],
    })
    expect(query).toHaveBeenCalledWith('adminToolbar')
  })

  it('loads the local tasks of a path, cached in the browser', async () => {
    const tasks = [{ label: 'Edit' }]
    query.mockResolvedValue({ data: { route: { localTasks: tasks } } })

    await expect(adapter().getLocalTasks('/news')).resolves.toBe(tasks)
    expect(query).toHaveBeenCalledWith(
      'localTasks',
      { path: '/news' },
      { graphqlCaching: { client: true } },
    )
  })

  it.each([
    ['no route', { route: null }],
    ['a route without local tasks', { route: { path: '/x' } }],
  ])('gives no local tasks for %s', async (_label, data) => {
    query.mockResolvedValue({ data })

    await expect(adapter().getLocalTasks('/x')).resolves.toEqual([])
  })

  it('gives the current language', () => {
    expect(adapter().getCurrentLanguage().value).toBe('en')
  })
})
