import type {
  BreadcrumbFragment,
  RouteNodeCanonicalQuery,
} from '#graphql-operations'

/**
 * Extract the breadcrumb from a route query.
 *
 * @see ~/pages/[language]/[...slug]/query.route.graphql
 */
function getBreadcrumbFromRouteQuery(
  routeQuery: RouteNodeCanonicalQuery | null,
): BreadcrumbFragment[] {
  if (routeQuery && routeQuery.route && 'breadcrumb' in routeQuery.route) {
    return routeQuery.route.breadcrumb || []
  }
  return []
}

/**
 * Returns the current breadcrumb links.
 */
export function useBreadcrumbLinks() {
  return useState<BreadcrumbFragment[]>('breadcrumbLinks', () => [])
}

/**
 * Set the breadcrumb links for the current page.
 */
export function setBreadcrumbLinksFromRoute(
  routeQuery: RouteNodeCanonicalQuery | null,
) {
  const links = useBreadcrumbLinks()
  links.value = getBreadcrumbFromRouteQuery(routeQuery)
}

/**
 * Set the breadcrumb links directly.
 */
export function setBreadcrumbLinks(newLinks?: BreadcrumbFragment[] | null) {
  const links = useBreadcrumbLinks()
  links.value = newLinks || []
}
