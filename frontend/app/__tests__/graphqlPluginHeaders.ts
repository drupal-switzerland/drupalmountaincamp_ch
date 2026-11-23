import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { incoming } = vi.hoisted(() => ({
  incoming: {
    headers: {} as Record<string, string | string[] | null | undefined>,
  },
}))

// In the browser useRequestHeaders gives nothing; during a server render it
// gives the headers of the page request.
mockNuxtImport('useRequestHeaders', () => () => incoming.headers)

type Hooks = {
  onRequest: (context: {
    request: string
    options: { params?: Record<string, unknown>; headers: Headers }
  }) => void
}

function forwardedHeaders() {
  const options = { headers: new Headers() }
  const hooks = useGraphqlState()!.fetchOptions as unknown as Hooks
  hooks.onRequest({ request: '/api/graphql/query/route', options })
  return Object.fromEntries(options.headers.entries())
}

describe('GraphQL plugin: headers of the page request', () => {
  beforeEach(() => {
    incoming.headers = {}
  })

  it('are copied onto the GraphQL request', () => {
    incoming.headers = { cookie: 'consent=1', 'accept-language': 'de' }

    expect(forwardedHeaders()).toEqual({
      cookie: 'consent=1',
      'accept-language': 'de',
    })
  })

  it('join a header with several values with a comma', () => {
    incoming.headers = { accept: ['text/html', 'application/json'] }

    expect(forwardedHeaders()).toEqual({
      accept: 'text/html, application/json',
    })
  })

  it('skip a header without a value', () => {
    incoming.headers = { cookie: undefined, accept: 'text/html' }

    expect(forwardedHeaders()).toEqual({ accept: 'text/html' })
  })

  it('skip a header that is null', () => {
    incoming.headers = { cookie: null, accept: 'text/html' }

    expect(forwardedHeaders()).toEqual({ accept: 'text/html' })
  })
})
