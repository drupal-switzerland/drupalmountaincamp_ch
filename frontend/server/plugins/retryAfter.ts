import { setResponseHeader } from 'h3'
import { retryAfterSeconds } from '../../app/helpers/backendUnavailable'

/**
 * Sends Retry-After with every 503 a page render throws (Drupal unavailable),
 * whether the client gets the HTML error page or the JSON error. Crawlers and
 * monitors then come back instead of treating the outage as a broken page.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, context) => {
    const statusCode =
      'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined
    const retryAfter = retryAfterSeconds(statusCode)
    if (retryAfter && context.event && !context.event.node.res.headersSent) {
      setResponseHeader(context.event, 'retry-after', retryAfter)
    }
  })
})
