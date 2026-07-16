import type { FetchResponse } from 'ofetch'
import type { H3Event } from 'h3'
import crypto from 'crypto'
import { INTERVALS, MAX_AGE, type ValidInterval } from '../helpers'

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

/**
 * Determine the number of seconds until the next given interval.
 *
 * Useful to calculate a max age for responses that should invalidate at the
 * same time, no matter when they were put in cache.
 *
 * For example, when pasing '5min' and the current time is 12:04:00, the
 * method will return 60.
 */
export function getSecondsUntilNextInterval(key: ValidInterval): number {
  const now = new Date()

  // Special handling for the midnight case.
  if (key === 'midnight') {
    now.setHours(24, 0, 0, 0)
    return Math.floor((now.getTime() - Date.now()) / 1000)
  }

  // Get the current timestamp in milliseconds
  const msSinceHourStart =
    now.getMinutes() * 60 * 1000 +
    now.getSeconds() * 1000 +
    now.getMilliseconds()

  const interval = INTERVALS[key]

  // Calculate the interval in milliseconds.
  const intervalMs = interval * 1000

  // Calculate the remaining milliseconds until the next interval.
  const millisecondsUntilNextInterval =
    intervalMs - (msSinceHourStart % intervalMs)

  // Convert milliseconds to seconds.
  return Math.floor(millisecondsUntilNextInterval / 1000)
}

/**
 * Convert the given cache tag or cache tags to its hashed version.
 *
 * Because our responses can contain a lot of cache tags, in order to avoid
 * headers that are too large, the fastly Drupal module will hash the cache
 * tags to a fixed length.
 *
 * In some cases, when directly building responses in the Nuxt app that have
 * to manually define cache tags, we need to "recreate" the same behaviour
 * as Drupal, so that when Drupal invalidates the hashed cache tags, our
 * custom responses also get invalidated.
 *
 * IMPORTANT: It is crucial that the logic for this method is in-sync with
 * Drupal or else responses are not properly invalidated. In particular, the
 * length of the hashed cache tag is configurable in Drupal.
 */
export function buildFastlyCacheTags(input: string | string[]): string[] {
  const tags = typeof input === 'string' ? [input] : input
  const siteId = useRuntimeConfig().fastlySiteId

  return tags.map(function (tag) {
    return crypto
      .createHash('md5')
      .update(siteId + ':' + tag)
      .digest('base64')
      .substring(0, 6)
  })
}
