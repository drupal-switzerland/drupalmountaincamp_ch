import { setResponseHeader, type H3Event } from 'h3'
import { hasDrupalSessionCookie } from '../../app/helpers/drupalSession'

const NOT_CACHEABLE = 'private, no-store'

// What these requests get back depends on the cookie or is editor output, so
// neither a browser nor a CDN may store it and fall back to its own default.
function markNotCacheable(event: H3Event) {
  setResponseHeader(event, 'cache-control', NOT_CACHEABLE)
  useCDNHeaders((cdn) => cdn.private(), event)
}

/**
 * Enable SPA mode for logged in users.
 *
 * In order to reduce load on the server we disable SSR for logged in users.
 */
export default defineEventHandler((event) => {
  if (!event.path) {
    return
  }
  // Skip API calls.
  if (
    !event.path ||
    event.path.includes('/api') ||
    event.path.includes('/__nuxt') ||
    event.path.match(/\.(js|woff|woff2|ico|svg)$/gm)
  ) {
    return
  }

  const isEditorRequest =
    event.path.includes('blokkliEditing') ||
    event.path.includes('blokkliPreview')

  // Check if we have a cookie.
  const headers = event.node.req.headers
  const cookie = headers.cookie
  if (!cookie) {
    if (isEditorRequest) {
      markNotCacheable(event)
    }
    return
  }

  // Check if a Drupal session cookie is present. If yes, set the magic header
  // to enable SPA mode.
  const hasSession = hasDrupalSessionCookie(cookie)
  if (isEditorRequest || hasSession) {
    if (!event.context.nuxt) {
      event.context.nuxt = {}
    }
    event.context.nuxt.noSSR = true
    event.context.hasSession = hasSession
    markNotCacheable(event)
    return
  }

  // Remove the incoming header so that SPA mode can't be forced.
  delete event.node.req.headers['x-nuxt-no-ssr']
})
