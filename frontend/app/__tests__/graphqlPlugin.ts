import { beforeEach, describe, expect, it } from 'vitest'

// The plugin (app/plugins/graphqlMiddleware.ts) runs when the test app starts
// and stores its hooks in the GraphQL state. Vitest runs the browser build, so
// only what the plugin does in the browser is reachable here.
type Hooks = {
  onRequest: (context: {
    request: string
    options: { params?: Record<string, unknown>; headers: Headers }
  }) => void
  onResponse: (context: { response?: { _data?: unknown } }) => void
}

function hooks() {
  return useGraphqlState()!.fetchOptions as unknown as Hooks
}

function request(params?: Record<string, unknown>) {
  const options = { params, headers: new Headers() }
  hooks().onRequest({ request: '/api/graphql/query/route', options })
  return options
}

function respond(data: unknown) {
  hooks().onResponse({ response: { _data: data } })
}

function message(type: string, safe: string) {
  return { type, safe, message: 'raw ' + safe, escaped: 'escaped ' + safe }
}

describe('GraphQL plugin: every request', () => {
  it('carries the build id, so a new deployment never reuses cached responses', () => {
    expect(request().params!.__h).toBe(useRuntimeConfig().app.buildId)
    expect(useRuntimeConfig().app.buildId).toBeTruthy()
  })

  it('carries the current language', () => {
    expect(request().params!.__l).toBe('en')
  })

  it('keeps the parameters the caller set', () => {
    const { params } = request({ variables: '{"path":"/news"}' })

    expect(params!.variables).toBe('{"path":"/news"}')
    expect(params!.__l).toBe('en')
  })

  it('is not marked as a server request in the browser', () => {
    expect(request().params).not.toHaveProperty('__server')
  })
})

describe('GraphQL plugin: Drupal messages in a response', () => {
  let messages: ReturnType<typeof useDrupalMessages>['messages']

  beforeEach(() => {
    messages = useDrupalMessages().messages
    messages.value = []
  })

  it('shows them with their type and sanitised text', () => {
    respond({
      data: {
        messengerMessages: [
          message('status', '<em>Saved</em>'),
          message('error', 'Not allowed'),
        ],
      },
    })

    expect(messages.value).toEqual([
      { type: 'status', message: '<em>Saved</em>' },
      { type: 'error', message: 'Not allowed' },
    ])
  })

  it('shows the same message once, also across responses', () => {
    const data = { data: { messengerMessages: [message('status', 'Saved')] } }
    respond(data)
    respond(data)

    expect(messages.value).toEqual([{ type: 'status', message: 'Saved' }])
  })

  it.each([
    ['no body', undefined],
    ['no data', { errors: [{ message: 'Failed' }] }],
    ['data without messages', { data: { route: null } }],
  ])('adds nothing for a response with %s', (_label, data) => {
    expect(() => respond(data)).not.toThrow()
    expect(messages.value).toEqual([])
  })
})
