import { canonicalPageQuery, canonicalPath } from '~/helpers/pagination'

/**
 * Redirects non-canonical `?page=` values (page=1, page=02, page=abc, repeated
 * parameters) and a trailing slash to the page's canonical URL, so each page
 * is cached and indexed under one address. Drupal does the same for the
 * routes it resolves.
 */
export default defineNuxtRouteMiddleware((to) => {
  const query = canonicalPageQuery(to.query)
  const path = canonicalPath(to.path)
  if (query || path !== to.path) {
    return navigateTo(
      { path, query: query ?? to.query, hash: to.hash },
      { redirectCode: 301 },
    )
  }
})
