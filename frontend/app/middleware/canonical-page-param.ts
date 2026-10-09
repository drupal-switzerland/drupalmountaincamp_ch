import { parsePageParam, withPageParam } from '~/helpers/pagination'

/**
 * Redirects non-canonical `?page=` values (page=1, page=02, page=abc, repeated
 * parameters) to the page's canonical URL, so each page is cached and indexed
 * under one address.
 */
export default defineNuxtRouteMiddleware((to) => {
  const query = withPageParam(to.query, parsePageParam(to.query.page))
  if (query.page !== to.query.page) {
    return navigateTo(
      { path: to.path, query, hash: to.hash },
      { redirectCode: 301 },
    )
  }
})
