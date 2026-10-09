import type { FetchResponse } from 'ofetch'
import type { H3Event } from 'h3'
import { MAX_AGE } from '../helpers'

function extractCacheTags(
  response: FetchResponse<unknown>,
  header: string,
): string[] {
  const value = response.headers.get(header) || ''
  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(' ')
    .map((v) => v.trim())
    .filter(Boolean)
}

function calculateMaxAge(expires: string | null): number {
  if (!expires) {
    return MAX_AGE.UNCACHEABLE
  }
  const expiresValue = parseInt(expires)
  if (isNaN(expiresValue)) {
    return MAX_AGE.UNCACHEABLE
  }

  if (expiresValue === 0) {
    return MAX_AGE.UNCACHEABLE
  }

  if (expiresValue === -1) {
    return MAX_AGE.ONE_YEAR
  }

  return expiresValue
}

/**
 * Extracts cacheability metadata from a Drupal fetch response.
 */
export function extractCacheability(
  response: FetchResponse<unknown>,
  event: H3Event,
) {
  const hasSessionCookie = (event.node.req.headers.cookie || '').includes(
    'SSESS',
  )
  // These tags are provided by the nuxt_multi_cache module and used to
  // cache the initData in the cache of nuxt_multi_cache in the frontend.
  const tagsNuxt = extractCacheTags(response, 'x-nuxt-cache-tags')

  // These tags are provided by the fastly module and used to invalidate
  // SSR full page caches on fastly.
  const tagsCdn = extractCacheTags(response, 'surrogate-key')

  // During development, we also pass the original Drupal cache tags.
  const tagsDrupal = extractCacheTags(response, 'x-drupal-cache-tags')

  const expires = response.headers.get('x-nuxt-expires')
  const maxAge = calculateMaxAge(expires)

  return {
    isCacheable: expires !== '0' && !!maxAge && !hasSessionCookie,
    maxAge,
    tagsNuxt,
    tagsCdn: tagsCdn.length ? tagsCdn : tagsDrupal,
    tagsDrupal,
  }
}
