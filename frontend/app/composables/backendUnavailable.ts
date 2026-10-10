/** Read and write access to the "Drupal unavailable" flag of one render. */
export type BackendUnavailableFlag = { value: boolean }

/**
 * Set during a server render once Drupal gave no response (the GraphQL route
 * answered 503). The rest of that render skips Drupal instead of waiting for
 * the timeout again, so the error page shows after one timeout, not several.
 * Kept on the request, not in useState: Nuxt renders the error page with a
 * fresh app state, and the flag must survive that. Other visitors are never
 * affected. Not a computed: event.context isn't reactive, so it would cache.
 */
export function useBackendUnavailable(): BackendUnavailableFlag {
  const event = useRequestEvent()
  let local = false
  return {
    get value() {
      return event ? !!event.context.backendUnavailable : local
    },
    set value(unavailable: boolean) {
      if (event) {
        event.context.backendUnavailable = unavailable
      } else {
        local = unavailable
      }
    },
  }
}
