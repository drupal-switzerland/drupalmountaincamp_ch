// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { refuseCacheApiRequest } from '../../server/utils/multiCache'

const TOKEN_HEADER = 'x-nuxt-multi-cache-token'

// What the module reads at runtime: the token from the environment (empty
// without one) and the callback from server/multiCache.serverOptions.ts.
const app = {
  config: { api: { authorizationToken: '', authorizationDisabled: false } },
  serverOptions: { api: { authorization: refuseCacheApiRequest } },
}

vi.mock(
  '../../node_modules/nuxt-multi-cache/dist/runtime/server/utils/useMultiCacheApp.js',
  () => ({ useMultiCacheApp: () => app }),
)

async function authorize(token?: string) {
  const { checkAuth } =
    await import('../../node_modules/nuxt-multi-cache/dist/runtime/server/api/helpers/index.js')
  const headers = token === undefined ? {} : { [TOKEN_HEADER]: token }
  return checkAuth({ node: { req: { headers } } } as unknown as H3Event)
}

describe('cache API authorization', () => {
  beforeEach(() => {
    app.config.api.authorizationToken = ''
  })

  it.each([
    ['no token header', undefined],
    ['an empty token header', ''],
    ['any token header', 'some-token'],
  ])(
    'refuses a request with %s when no token is configured',
    async (_, token) => {
      await expect(authorize(token)).rejects.toMatchObject({ statusCode: 401 })
    },
  )

  it.each([
    ['no token header', undefined],
    ['a wrong token', 'not-the-token'],
  ])(
    'refuses a request with %s when a token is configured',
    async (_, token) => {
      app.config.api.authorizationToken = 'token-from-the-environment'

      await expect(authorize(token)).rejects.toMatchObject({ statusCode: 401 })
    },
  )

  it('accepts the configured token', async () => {
    app.config.api.authorizationToken = 'token-from-the-environment'

    await expect(
      authorize('token-from-the-environment'),
    ).resolves.toBeUndefined()
  })
})
