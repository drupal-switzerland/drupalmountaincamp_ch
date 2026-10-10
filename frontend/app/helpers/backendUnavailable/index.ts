import { createError } from 'h3'

/** Status the GraphQL route answers when Drupal gave no response in time. */
export const BACKEND_UNAVAILABLE_STATUS = 503

/**
 * After a failed GraphQL response during a server render: the page is never
 * cacheable, and a 503 marks Drupal unavailable for the rest of the render.
 */
export function handleBackendResponseError(
  status: number | undefined,
  unavailable: { value: boolean },
  markPageUncacheable: () => void,
) {
  markPageUncacheable()
  if (status === BACKEND_UNAVAILABLE_STATUS) {
    unavailable.value = true
  }
}

/**
 * Before a GraphQL request during a server render: once Drupal is marked
 * unavailable, fail at once (uncacheable) instead of waiting for the timeout.
 */
export function guardBackendRequest(
  unavailable: { value: boolean },
  markPageUncacheable: () => void,
) {
  if (!unavailable.value) {
    return
  }
  markPageUncacheable()
  throw createError({
    statusCode: BACKEND_UNAVAILABLE_STATUS,
    statusMessage: 'Drupal gave no response earlier in this render',
  })
}
