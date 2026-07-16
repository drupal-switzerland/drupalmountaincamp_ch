import { describe, expect, test, vi } from 'vitest'
import graphqlMiddlewareConfig from './../../server/graphqlMiddleware.serverOptions'
import type { H3Event } from 'h3'

vi.mock('#graphql-server-options', () => {
  return {
    defineGraphqlServerOptions(v: unknown) {
      return v
    },
  }
})

describe('The nuxt-graphql-middleware config', () => {
  test('Passes appropriate incoming headers', async () => {
    expect(graphqlMiddlewareConfig.serverFetchOptions).toBeDefined()

    const event = {
      node: {
        req: {
          headers: {
            foobar: 'test',
            cookie: 'my_cookie',
          },
        },
      },
    } as unknown as H3Event

    const result = await graphqlMiddlewareConfig!.serverFetchOptions!(event)
    // @ts-ignore
    expect(result.headers?.foobar).toBeUndefined()
    // @ts-ignore
    expect(result.headers?.cookie).toEqual('my_cookie')
  })
})
