import { getResponseStatus, type H3Event } from 'h3'
import { CDN_CACHE_CONTROL_HEADER } from '../../config/multiCache'
import { isCdnCacheableStatus } from '../utils/errorCacheability'

const NOT_CACHEABLE = 'private'

/**
 * Makes the response private for the CDN and keeps it so. Nuxt renders the
 * error page in a second, internal request and copies that response's headers
 * onto this one, so a header set once here would be replaced.
 */
function pinNotCacheable(event: H3Event) {
  const res = event.node.res
  if (res.headersSent) {
    return
  }
  const setHeader = res.setHeader.bind(res)
  res.setHeader = (name, value) =>
    setHeader(
      name,
      name.toLowerCase() === CDN_CACHE_CONTROL_HEADER.toLowerCase()
        ? NOT_CACHEABLE
        : value,
    )
  setHeader(CDN_CACHE_CONTROL_HEADER, NOT_CACHEABLE)
}

/**
 * No error response keeps a cacheable CDN-Cache-Control. A page's GraphQL
 * responses set that header before the page turns out to be a 404, and a CDN
 * that stored the 404 would keep serving it after the page is created.
 */
export default defineNitroPlugin((nitroApp) => {
  // A thrown error has no status on the response yet, so every one counts.
  nitroApp.hooks.hook('error', (_error, context) => {
    if (context.event) {
      pinNotCacheable(context.event)
    }
  })

  // An error status set without throwing.
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (!isCdnCacheableStatus(getResponseStatus(event))) {
      pinNotCacheable(event)
    }
  })
})
