// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import {
  BACKEND_UNAVAILABLE_STATUS,
  guardBackendRequest,
  handleBackendResponseError,
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
