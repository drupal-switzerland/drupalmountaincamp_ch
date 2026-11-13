import { afterEach, describe, expect, it, vi } from 'vitest'
import { prepareGraphqlRequest } from '~/helpers/graphqlRequest'

describe('Preparing a GraphQL request', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('leaves the page cacheable when preparing succeeds', () => {
    const markPageUncacheable = vi.fn()
    const prepare = vi.fn()

    prepareGraphqlRequest(prepare, markPageUncacheable)

    expect(prepare).toHaveBeenCalledOnce()
    expect(markPageUncacheable).not.toHaveBeenCalled()
  })

  it('marks the page uncacheable, logs and does not throw when preparing fails', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const markPageUncacheable = vi.fn()
    const error = new Error('broken headers')

    expect(() =>
      prepareGraphqlRequest(() => {
        throw error
      }, markPageUncacheable),
    ).not.toThrow()

    expect(markPageUncacheable).toHaveBeenCalledOnce()
    expect(log).toHaveBeenCalledWith(
      'Failed to prepare the GraphQL request.',
      error,
    )
  })
})
