import { describe, expect, test, vi } from 'vitest'
import graphqlMiddlewareConfig from './../../server/graphqlMiddleware.serverOptions'
import type { H3Event } from 'h3'
import { FetchError } from 'ofetch'
import {
  BACKEND_QUERY_TIMEOUT_MS,
  BACKEND_RETRY_AFTER_SECONDS,
  BACKEND_WRITE_TIMEOUT_MS,
  backendFetchTimeout,
  resolveQueryTimeout,
} from './../../server/helpers'

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

  test('Forwards only the allow-listed request headers to Drupal', async () => {
    const forwarded = {
      'x-forwarded-for': '203.0.113.7',
      'x-forwarded-proto': 'https',
      'x-forwarded-port': '443',
      referer: 'https://drupalmountaincamp.ch/news',
      'user-agent': 'Vitest',
      cookie: 'SSESSabc=def',
    }
    const event = {
      node: {
        req: {
          headers: {
            ...forwarded,
            // Nothing at Drupal reads it, and the cache decision ignores it.
            authorization: 'Basic abc',
            // Nothing reads these either; Drupal takes the client address
            // from X-Forwarded-For.
            'x-real-ip': '203.0.113.7',
            'x-client-ip': '203.0.113.7',
            host: 'attacker.example',
            'content-length': '999',
            'x-middleware-subrequest': '1',
            'x-custom': 'value',
          },
        },
      },
    } as unknown as H3Event

    const result = await graphqlMiddlewareConfig.serverFetchOptions!(event)
    const headers = { ...(result.headers as Record<string, string>) }
    delete headers['x-drupal-graphql-token']

    expect(headers).toEqual(forwarded)
  })

  test("Sends the configured GraphQL token, never a visitor's", async () => {
    const config = useRuntimeConfig() as { drupalGraphqlToken?: string }
    const previous = config.drupalGraphqlToken
    config.drupalGraphqlToken = 'from-the-server-config'
    const event = {
      node: {
        req: { headers: { 'x-drupal-graphql-token': 'from-the-visitor' } },
      },
    } as unknown as H3Event

    try {
      const result = await graphqlMiddlewareConfig.serverFetchOptions!(event)
      const headers = result.headers as Record<string, string>

      expect(headers['x-drupal-graphql-token']).toBe('from-the-server-config')
    } finally {
      config.drupalGraphqlToken = previous
    }
  })

  test('Reads the GraphQL endpoint from the backend URL in the runtime config', () => {
    const config = useRuntimeConfig() as { backendUrl?: string }
    const previous = config.backendUrl
    config.backendUrl = 'http://drupal.test'
    try {
      expect(graphqlMiddlewareConfig.graphqlEndpoint!(undefined as never)).toBe(
        'http://drupal.test/graphql',
      )
    } finally {
      config.backendUrl = previous
    }
  })

  test('Sends Drupal the public host for a request on an internal route on production', async () => {
    const event = {
      node: {
        req: {
          headers: {
            'x-forwarded-host':
              'frontend.prod.drupalmountaincamp-ch.ch4.amazee.io',
          },
        },
      },
    } as unknown as H3Event
    vi.stubEnv('LAGOON_ENVIRONMENT_TYPE', 'production')
    try {
      const result = await graphqlMiddlewareConfig!.serverFetchOptions!(event)
      // @ts-ignore
      expect(result.headers?.['x-forwarded-host']).toBe('drupalmountaincamp.ch')
    } finally {
      vi.unstubAllEnvs()
    }
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
      headers: [
        // Drupal marks the response cacheable for an hour.
        ['x-nuxt-expires', '3600'],
        ...cookies.map((cookie): [string, string] => ['set-cookie', cookie]),
      ],
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

  test('Keeps a cacheable response without cookies cacheable', async () => {
    const { event } = createEvent()

    const result = await graphqlMiddlewareConfig.onServerResponse!(
      event,
      createResponse([]),
    )

    expect(result.__cacheability?.isCacheable).toBe(true)
  })

  test('Marks a response that carries Drupal messages as uncacheable', async () => {
    const { event } = createEvent()
    const response = Object.assign(createResponse([]) as Response, {
      _data: { data: { messengerMessages: [{ type: 'status' }] } },
    }) as never

    const result = await graphqlMiddlewareConfig.onServerResponse!(
      event,
      response,
    )

    expect(result.__cacheability?.isCacheable).toBe(false)
  })

  test('Keeps a response with an empty message list cacheable', async () => {
    const { event } = createEvent()
    const response = Object.assign(createResponse([]) as Response, {
      _data: { data: { messengerMessages: [] } },
    }) as never

    const result = await graphqlMiddlewareConfig.onServerResponse!(
      event,
      response,
    )

    expect(result.__cacheability?.isCacheable).toBe(true)
  })

  test('Passes data and errors from Drupal through unchanged', async () => {
    const { event } = createEvent()
    const data = { route: { path: '/news' } }
    const errors = [{ message: 'Partial failure' }]
    const response = Object.assign(createResponse([]) as Response, {
      _data: { data, errors },
    }) as never

    const result = await graphqlMiddlewareConfig.onServerResponse!(
      event,
      response,
    )

    expect(result.data).toBe(data)
    expect(result.errors).toBe(errors)
  })

  test('Sets no cookie header when Drupal sends none', () => {
    const { event, headers } = createEvent()

    graphqlMiddlewareConfig.onServerResponse!(event, createResponse([]))

    expect(headers.has('set-cookie')).toBe(false)
  })

  async function timeoutFor(operation: string | null | undefined) {
    const event = {
      node: { req: { headers: {} } },
    } as unknown as H3Event
    const withEvent = await graphqlMiddlewareConfig.serverFetchOptions!(
      event,
      operation,
    )
    const withoutEvent = await graphqlMiddlewareConfig.serverFetchOptions!(
      undefined as unknown as H3Event,
      operation,
    )
    expect(withoutEvent.timeout).toBe(withEvent.timeout)
    return withEvent.timeout
  }

  test('Bounds a query with the short query timeout', async () => {
    expect(await timeoutFor('query')).toBe(BACKEND_QUERY_TIMEOUT_MS)
  })

  // Uploads reach serverFetchOptions as a mutation; the do-request route
  // passes no operation type.
  test.each([['mutation'], [null], [undefined]])(
    'Gives a %s operation the long write timeout',
    async (operation) => {
      expect(await timeoutFor(operation)).toBe(BACKEND_WRITE_TIMEOUT_MS)
    },
  )

  test('Keeps the write timeout well above the query timeout', () => {
    expect(BACKEND_WRITE_TIMEOUT_MS).toBeGreaterThan(BACKEND_QUERY_TIMEOUT_MS)
  })

  test('Applies a configured query timeout to queries only', () => {
    expect(backendFetchTimeout('query', 20_000)).toBe(20_000)
    expect(backendFetchTimeout('mutation', 20_000)).toBe(
      BACKEND_WRITE_TIMEOUT_MS,
    )
  })

  test.each([
    [20_000, 20_000],
    ['20000', 20_000],
    [undefined, BACKEND_QUERY_TIMEOUT_MS],
    ['', BACKEND_QUERY_TIMEOUT_MS],
    ['soon', BACKEND_QUERY_TIMEOUT_MS],
    [0, BACKEND_QUERY_TIMEOUT_MS],
    [-5, BACKEND_QUERY_TIMEOUT_MS],
    [true, BACKEND_QUERY_TIMEOUT_MS],
  ])('Reads the configured query timeout %o as %i ms', (configured, ms) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(resolveQueryTimeout(configured)).toBe(ms)
    } finally {
      warn.mockRestore()
    }
  })

  function respondToError(error: FetchError) {
    const headers = new Map<string, unknown>()
    const res = {
      statusCode: 200,
      statusMessage: '',
      setHeader: (name: string, value: unknown) => headers.set(name, value),
    }
    const event = { node: { req: { headers: {} }, res } } as unknown as H3Event
    graphqlMiddlewareConfig.onServerError!(event, error, null, null, null)
    return { status: res.statusCode, retryAfter: headers.get('retry-after') }
  }

  test('Answers 503 with Retry-After when Drupal gives no response', () => {
    expect(respondToError(new FetchError('timeout'))).toEqual({
      status: 503,
      retryAfter: BACKEND_RETRY_AFTER_SECONDS,
    })
  })

  function upstreamError(status: number) {
    return Object.assign(new FetchError('upstream error'), {
      response: new Response('', { status }),
    })
  }

  // nginx answers for a Drupal that is down or in maintenance.
  test.each([[502], [503], [504]])(
    'Answers 503 with Retry-After for an upstream %i',
    (status) => {
      expect(respondToError(upstreamError(status))).toEqual({
        status: 503,
        retryAfter: BACKEND_RETRY_AFTER_SECONDS,
      })
    },
  )

  test.each([[400], [403], [500]])(
    'Answers 500 without Retry-After for an upstream %i',
    (status) => {
      expect(respondToError(upstreamError(status))).toEqual({
        status: 500,
        retryAfter: undefined,
      })
    },
  )
})
