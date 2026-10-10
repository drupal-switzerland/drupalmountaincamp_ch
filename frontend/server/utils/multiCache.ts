import { getHeaders, type H3Event } from 'h3'

/** Caching is off for a request that carries a Drupal session cookie. */
export function isCacheEnabledForRequest(event: H3Event): boolean {
  const hasSession = (event.node.req.headers.cookie || '').includes('SSESS')
  return !hasSession
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
