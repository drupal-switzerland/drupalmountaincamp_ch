import { describe, expect, test } from 'vitest'
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

  function createEvent(initialHeaders: Record<string, string | string[]> = {}) {
    const headers = new Map(Object.entries(initialHeaders))
    const url = '/api/graphql_query/route?__server=true'
    const event = {
      path: url,
      node: {
        req: { url, headers: {} },
        res: {
          getHeader: (name: string) => headers.get(name),
          setHeader: (name: string, value: string | string[]) =>
            headers.set(name, value),
        },
      },
    } as unknown as H3Event
    return { event, headers }
  }

  function createResponse(cookies: string[]) {
    const response = new Response('{}', {
      headers: cookies.map((cookie): [string, string] => [
        'set-cookie',
        cookie,
      ]),
    })
    return Object.assign(response, { _data: { data: {} } }) as never
  }

  test('Passes each cookie from Drupal as its own set-cookie header', () => {
    const { event, headers } = createEvent()

    graphqlMiddlewareConfig.onServerResponse!(
      event,
      createResponse([
        'SSESSabc=1; Path=/; HttpOnly',
        'Drupal.visitor.lang=en; Path=/',
      ]),
    )

    expect(headers.get('set-cookie')).toEqual([
      'SSESSabc=1; Path=/; HttpOnly',
      'Drupal.visitor.lang=en; Path=/',
    ])
  })

  test('Keeps cookies already set on the response', () => {
    const { event, headers } = createEvent({ 'set-cookie': 'existing=1' })

    graphqlMiddlewareConfig.onServerResponse!(
      event,
      createResponse(['SSESSabc=1']),
    )

    expect(headers.get('set-cookie')).toEqual(['existing=1', 'SSESSabc=1'])
  })

  test('Marks a response that sets cookies as uncacheable', async () => {
    const { event } = createEvent()

    const result = await graphqlMiddlewareConfig.onServerResponse!(
      event,
      createResponse(['SSESSabc=1']),
    )

    expect(result.__cacheability?.isCacheable).toBe(false)
  })

  test('Sets no cookie header when Drupal sends none', () => {
    const { event, headers } = createEvent()

    graphqlMiddlewareConfig.onServerResponse!(event, createResponse([]))

    expect(headers.has('set-cookie')).toBe(false)
  })
})
