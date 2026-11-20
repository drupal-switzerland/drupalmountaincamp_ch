import type { GraphqlCacheability } from '~~/server/helpers'

type CdnHelper = Parameters<Parameters<typeof useCDNHeaders>[0]>[0]

type GraphqlPageResponse = {
  errors?: unknown[]
  __cacheability?: GraphqlCacheability
}

/**
 * The cacheability a GraphQL response gives the page rendering it, or null
 * when the page must not be cached: no response data, GraphQL errors, or a
 * response Drupal marked uncacheable.
 */
export function getPageCacheability(
  data: GraphqlPageResponse | null | undefined,
): GraphqlCacheability | null {
  if (!data || data.errors?.length || !data.__cacheability?.isCacheable) {
    return null
  }
  return data.__cacheability
}

/**
 * Passes the cacheability of one GraphQL response on to the CDN headers of the
 * page: private without it, otherwise public with its max age and tags.
 */
export function applyPageCacheability(
  helper: CdnHelper,
  cacheability: GraphqlCacheability | null,
) {
  if (!cacheability) {
    helper.private()
    return
  }

  helper
    .public()
    .setNumeric('maxAge', cacheability.maxAge)
    .addTags(cacheability.tagsCdn)
}
