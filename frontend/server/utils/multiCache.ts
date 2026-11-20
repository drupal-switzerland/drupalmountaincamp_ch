import type { H3Event } from 'h3'
import { hasDrupalSessionCookie } from '../../app/helpers/drupalSession'

/** Caching is off for a request that carries a Drupal session cookie. */
export function isCacheEnabledForRequest(event: H3Event): boolean {
  return !hasDrupalSessionCookie(event.node.req.headers.cookie)
}

/**
 * The route cache key of a request: its path with the query string.
 * Cookies are not part of it. A request with a Drupal session never reaches
 * the route cache (isCacheEnabledForRequest), so the entries are shared by
 * everyone else; a route that varies by another cookie must opt out of the
 * route cache.
 */
export function buildRouteCacheKey(event: H3Event): string {
  // Percent-encoded, so two different URLs never share a key.
  return encodeURIComponent(event.path || '')
}

/**
 * The cache API's authorization callback. nuxt-multi-cache compares the
 * request's token with NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN itself and
 * only asks this callback when that variable is not set.
 */
export function refuseCacheApiRequest(): Promise<boolean> {
  return Promise.resolve(false)
}
