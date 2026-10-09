import { BACKEND_RETRY_AFTER_MS } from '../helpers'

let unavailableUntil = 0

/** Records that Drupal gave no response, unless the window is already open. */
export function markBackendUnavailable(now = Date.now()) {
  if (now >= unavailableUntil) {
    unavailableUntil = now + BACKEND_RETRY_AFTER_MS
  }
}

/** Seconds until the next real attempt, or 0 when requests may go out. */
export function backendRetryAfterSeconds(now = Date.now()) {
  return Math.max(0, Math.ceil((unavailableUntil - now) / 1000))
}

/**
 * An already aborted signal while Drupal is marked unavailable, so the request
 * fails immediately with no response; undefined otherwise.
 */
export function backendUnavailableSignal(now = Date.now()) {
  return backendRetryAfterSeconds(now) > 0
    ? AbortSignal.abort(new Error('Drupal is marked unavailable'))
    : undefined
}

/** Test helper: forget any recorded outage. */
export function resetBackendAvailability() {
  unavailableUntil = 0
}
