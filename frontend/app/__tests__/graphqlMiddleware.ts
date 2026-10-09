import { describe, expect, test, vi } from 'vitest'
import graphqlMiddlewareConfig from './../../server/graphqlMiddleware.serverOptions'
import type { H3Event } from 'h3'

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

  test('Passes each cookie from Drupal as its own set-cookie header', () => {
    const setHeader = vi.fn()
    const event = {
      node: {
        req: { url: '/api/graphql_query/route', headers: {} },
        res: { setHeader },
      },
    } as unknown as H3Event

    const response = new Response('{}', {
      headers: [
        ['set-cookie', 'SSESSabc=1; Path=/; HttpOnly'],
        ['set-cookie', 'Drupal.visitor.lang=en; Path=/'],
      ],
    })
    Object.assign(response, { _data: { data: {} } })

    graphqlMiddlewareConfig.onServerResponse!(event, response as never)

    expect(setHeader).toHaveBeenCalledWith('set-cookie', [
      'SSESSabc=1; Path=/; HttpOnly',
      'Drupal.visitor.lang=en; Path=/',
    ])
  })

  test('Sets no cookie header when Drupal sends none', () => {
    const setHeader = vi.fn()
    const event = {
      node: {
        req: { url: '/api/graphql_query/route', headers: {} },
        res: { setHeader },
      },
    } as unknown as H3Event
    const response = new Response('{}')
    Object.assign(response, { _data: { data: {} } })

    graphqlMiddlewareConfig.onServerResponse!(event, response as never)

    expect(setHeader).not.toHaveBeenCalledWith('set-cookie', expect.anything())
  })
})
