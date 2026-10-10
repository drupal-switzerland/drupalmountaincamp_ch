import { getHeaders, type H3Event } from 'h3'
import { hasDrupalSessionCookie } from '../../app/helpers/drupalSession'

/** Caching is off for a request that carries a Drupal session cookie. */
export function isCacheEnabledForRequest(event: H3Event): boolean {
  return !hasDrupalSessionCookie(event.node.req.headers.cookie)
}

/** The route cache key of a request: its path and its Cookie header. */
export function buildRouteCacheKey(event: H3Event): string {
  const path = (event.path || '')
    .replaceAll('/', '__')
    .replaceAll('?', '__')
    .replaceAll('&', '__')

  const headers = getHeaders(event)
  const cookie = headers.cookie || 'anonymous'
  return path + cookie
}
