import { START_LOCATION, type RouteLocationNormalized } from 'vue-router'

/** The skip link target in layouts/default.vue. */
export const MAIN_CONTENT_ID = 'main-content'

/**
 * Whether a finished navigation shows another page. The first load keeps the
 * browser's own focus, and query or hash changes stay on the page (the news
 * pagination moves focus to its results itself).
 */
export function isNavigationToAnotherPage(
  to: Pick<RouteLocationNormalized, 'path'>,
  from: Pick<RouteLocationNormalized, 'path'>,
  failure?: unknown,
): boolean {
  return !failure && from !== START_LOCATION && to.path !== from.path
}
