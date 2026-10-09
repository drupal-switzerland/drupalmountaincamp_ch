import type { GraphqlCacheability } from '~~/server/helpers'

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
