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

  // Check if we have a cookie.
  const headers = event.node.req.headers
  const cookie = headers.cookie
  if (!cookie) {
    return
  }

  // Check if a Drupal session cookie is present. If yes, set the magic header
  // to enable SPA mode.
  const hasSession = cookie.includes('SSESS')
  if (
    event.path.includes('blokkliEditing') ||
    event.path.includes('blokkliPreview') ||
    hasSession
  ) {
    if (!event.context.nuxt) {
      event.context.nuxt = {}
    }
    event.context.nuxt.noSSR = true
    event.context.hasSession = hasSession
    return
  }

  // Remove the incoming header so that SPA mode can't be forced.
  delete event.node.req.headers['x-nuxt-no-ssr']
})
