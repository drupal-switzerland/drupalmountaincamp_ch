// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { BACKEND_RETRY_AFTER_SECONDS } from '../helpers/backendUnavailable'

type ErrorHook = (error: Error, context: { event?: H3Event }) => void

let onError: ErrorHook

beforeAll(async () => {
  vi.stubGlobal(
    'defineNitroPlugin',
    (setup: (nitroApp: unknown) => void) => setup,
  )
  const setup = (await import('../../server/plugins/retryAfter'))
    .default as unknown as (nitroApp: unknown) => void
  setup({
    hooks: {
      hook: (name: string, handler: ErrorHook) => {
        if (name === 'error') {
          onError = handler
        }
      },
    },
  })
  vi.unstubAllGlobals()
})

function failWith(statusCode: number | undefined, headersSent = false) {
  const headers: Record<string, string> = {}
  const event = {
    node: {
      res: {
        headersSent,
        setHeader: (name: string, value: unknown) => {
          headers[name.toLowerCase()] = String(value)
        },
      },
    },
  } as unknown as H3Event
  onError(Object.assign(new Error('failed'), { statusCode }), { event })
  return headers
}

describe('Retry-After on a thrown 503', () => {
  it('is sent with the configured number of seconds', () => {
    expect(failWith(503)).toEqual({
      'retry-after': String(BACKEND_RETRY_AFTER_SECONDS),
    })
  })

  it.each([404, 500, undefined])('is not sent for %s', (statusCode) => {
    expect(failWith(statusCode)).toEqual({})
  })

  it('leaves a response alone once its headers are sent', () => {
    expect(failWith(503, true)).toEqual({})
  })

  it('ignores errors without a request', () => {
    expect(() => onError(new Error('boot'), {})).not.toThrow()
  })
})
