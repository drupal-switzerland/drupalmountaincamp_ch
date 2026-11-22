import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { H3Event } from 'h3'
import {
  useBackendUnavailable,
  useRetryAfterHeader,
} from '../composables/backendUnavailable'
import {
  BACKEND_RETRY_AFTER_SECONDS,
  BACKEND_UNAVAILABLE_STATUS,
} from '../helpers/backendUnavailable'
import { createResponseRecorder } from './support/cdnHeaders'

const { request } = vi.hoisted(() => ({
  request: { event: undefined as H3Event | undefined },
}))

mockNuxtImport('useRequestEvent', () => () => request.event)

function createEvent() {
  return { context: {} } as unknown as H3Event
}

describe('Drupal unavailable flag', () => {
  beforeEach(() => {
    request.event = undefined
  })

  it('starts out available', () => {
    request.event = createEvent()

    expect(useBackendUnavailable().value).toBe(false)
  })

  it('is kept on the request, so a later read in the same render sees it', () => {
    request.event = createEvent()
    useBackendUnavailable().value = true

    // The error page is rendered with a fresh app state but the same request.
    expect(useBackendUnavailable().value).toBe(true)
    expect(request.event.context.backendUnavailable).toBe(true)
  })

  it('does not leak from one request to the next', () => {
    request.event = createEvent()
    useBackendUnavailable().value = true
    request.event = createEvent()

    expect(useBackendUnavailable().value).toBe(false)
  })

  it('can be cleared again', () => {
    request.event = createEvent()
    const flag = useBackendUnavailable()
    flag.value = true
    flag.value = false

    expect(useBackendUnavailable().value).toBe(false)
  })

  it('works without a request, as in the browser', () => {
    const flag = useBackendUnavailable()

    expect(flag.value).toBe(false)
    flag.value = true
    expect(flag.value).toBe(true)
    // Nothing is shared between two flags outside a request.
    expect(useBackendUnavailable().value).toBe(false)
  })
})

describe('Retry-After on a 503 a page sets itself', () => {
  function createEventWithResponse() {
    const response = createResponseRecorder()
    request.event = {
      context: {},
      node: { req: { headers: {} }, res: response.res },
    } as unknown as H3Event
    return response.headers
  }

  it('is sent with a 503', () => {
    const headers = createEventWithResponse()

    useRetryAfterHeader(BACKEND_UNAVAILABLE_STATUS)

    expect(headers.get('retry-after')).toBe(BACKEND_RETRY_AFTER_SECONDS)
  })

  it.each([200, 500, undefined])('is not sent with %s', (status) => {
    const headers = createEventWithResponse()

    useRetryAfterHeader(status)

    expect(headers.has('retry-after')).toBe(false)
  })

  it('is skipped without a request, as in the browser', () => {
    request.event = undefined

    expect(() => useRetryAfterHeader(BACKEND_UNAVAILABLE_STATUS)).not.toThrow()
  })
})
