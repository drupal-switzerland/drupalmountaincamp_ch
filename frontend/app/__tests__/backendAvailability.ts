// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest'
import { BACKEND_RETRY_AFTER_MS } from '../../server/helpers'
import {
  backendRetryAfterSeconds,
  backendUnavailableSignal,
  markBackendUnavailable,
  resetBackendAvailability,
} from '../../server/utils/backendAvailability'

const T0 = 1_000_000

describe('backend availability', () => {
  beforeEach(() => {
    resetBackendAvailability()
  })

  it('lets requests through while nothing failed', () => {
    expect(backendUnavailableSignal(T0)).toBeUndefined()
    expect(backendRetryAfterSeconds(T0)).toBe(0)
  })

  it('aborts requests during the window after a failure', () => {
    markBackendUnavailable(T0)

    expect(backendUnavailableSignal(T0 + 1)?.aborted).toBe(true)
    expect(backendRetryAfterSeconds(T0)).toBe(BACKEND_RETRY_AFTER_MS / 1000)
  })

  it('tries Drupal again once the window has passed', () => {
    markBackendUnavailable(T0)

    expect(
      backendUnavailableSignal(T0 + BACKEND_RETRY_AFTER_MS),
    ).toBeUndefined()
  })

  it('does not extend the window for requests it aborted itself', () => {
    markBackendUnavailable(T0)
    markBackendUnavailable(T0 + 5_000)

    expect(
      backendUnavailableSignal(T0 + BACKEND_RETRY_AFTER_MS),
    ).toBeUndefined()
  })
})
