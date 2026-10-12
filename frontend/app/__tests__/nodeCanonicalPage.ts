import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import NodePage from '../pages/node/[nid]/index.vue'

// The app itself queries Drupal while it starts (init data, the user), before
// any test has said what Drupal answers.
const { query } = vi.hoisted(() => ({
  query: vi.fn(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (..._args: any[]): Promise<any> => ({ data: {} }),
  ),
}))

mockNuxtImport('useGraphqlQuery', () => query)

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>
let wrapper: Wrapper | undefined

describe('/node/<nid>', () => {
  beforeEach(() => {
    clearNuxtData()
    clearNuxtState()
    query.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('has no page type, instead of failing, once its route data is gone', async () => {
    query.mockResolvedValue({
      data: {
        route: {
          entity: { title: 'A title' },
          entityGlobal: { __typename: 'NodePage' },
        },
      },
    })
    wrapper = await mountSuspended(NodePage, {
      global: { stubs: { NodePage: true, NodePressRelease: true } },
    })
    const page = wrapper.vm as unknown as { pageType?: string }
    expect(page.pageType).toBe('NodePage')

    // The route data is cleared while the page is still on screen.
    clearNuxtData()

    expect(() => page.pageType).not.toThrow()
    expect(page.pageType).toBeUndefined()
  })
})
