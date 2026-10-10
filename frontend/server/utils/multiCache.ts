import { getHeaders, type H3Event } from 'h3'
import { hasDrupalSessionCookie } from '../../app/helpers/drupalSession'

/** Caching is off for a request that carries a Drupal session cookie. */
export function isCacheEnabledForRequest(event: H3Event): boolean {
  return !hasDrupalSessionCookie(event.node.req.headers.cookie)
}

/** The route cache key of a request: its path and its Cookie header. */
export function buildRouteCacheKey(event: H3Event): string {
  // Percent-encoded, so two different URLs never share a key.
  const path = encodeURIComponent(event.path || '')

  const headers = getHeaders(event)
  const cookie = headers.cookie || 'anonymous'
  return path + cookie
}
