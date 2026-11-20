// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  BACKEND_UNAVAILABLE_STATUS,
  guardBackendRequest,
  handleBackendResponseError,
  BACKEND_RETRY_AFTER_SECONDS,
  retryAfterSeconds,
} from '../helpers/backendUnavailable'

describe('Drupal unavailable during a server render', () => {
  it('marks the page uncacheable and Drupal unavailable on a 503', () => {
    const unavailable = ref(false)
    const markPageUncacheable = vi.fn()

    handleBackendResponseError(503, unavailable, markPageUncacheable)

    expect(markPageUncacheable).toHaveBeenCalledOnce()
    expect(unavailable.value).toBe(true)
  })

  it('keeps Drupal available after other errors, but still uncacheable', () => {
    const unavailable = ref(false)
    const markPageUncacheable = vi.fn()

    handleBackendResponseError(500, unavailable, markPageUncacheable)

    expect(markPageUncacheable).toHaveBeenCalledOnce()
    expect(unavailable.value).toBe(false)
  })

  it('lets requests through while Drupal is available', () => {
    const markPageUncacheable = vi.fn()

    expect(() =>
      guardBackendRequest(ref(false), markPageUncacheable),
    ).not.toThrow()
    expect(markPageUncacheable).not.toHaveBeenCalled()
  })

  it('fails later requests at once, uncacheable, with a 503', () => {
    const markPageUncacheable = vi.fn()

    expect(() => guardBackendRequest(ref(true), markPageUncacheable)).toThrow(
      expect.objectContaining({ statusCode: BACKEND_UNAVAILABLE_STATUS }),
    )
    expect(markPageUncacheable).toHaveBeenCalledOnce()
  })
})

describe('retryAfterSeconds', () => {
  it('gives the retry hint for a 503', () => {
    expect(retryAfterSeconds(503)).toBe(BACKEND_RETRY_AFTER_SECONDS)
    expect(BACKEND_RETRY_AFTER_SECONDS).toBeGreaterThan(0)
  })

  it.each([200, 404, 500, 502, undefined])('gives none for %s', (status) => {
    expect(retryAfterSeconds(status)).toBeUndefined()
  })
})
