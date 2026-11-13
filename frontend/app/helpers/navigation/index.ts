/** Main menu link rendered as the Tickets button: the page or the shop. */
export const TICKETS_PATH = '/tickets'
export const TICKET_SHOP_URL = 'https://pretix.eu/mountain-camp/2027/'

const NEW_TAB_TARGET = '_blank'
// VuepalLink opens every external URL in a new tab unless given a target.
const SAME_TAB_TARGET = '_self'

const withoutTrailingSlash = (url: string) =>
  url.endsWith('/') ? url.slice(0, -1) : url

export function isTicketsUrl(path?: string | null) {
  return (
    path === TICKETS_PATH ||
    (!!path &&
      withoutTrailingSlash(path) === withoutTrailingSlash(TICKET_SHOP_URL))
  )
}

/** The Drupal menu link target, or the same tab when none is set. */
export function linkTarget(target?: string | null) {
  return target || SAME_TAB_TARGET
}

export function opensNewTab(target: string) {
  return target === NEW_TAB_TARGET
}

/** The news overview, parent of the news articles. */
export const NEWS_OVERVIEW_PATH = '/news'

/** RSS feed of the news, served by Drupal (views.view.news). */
export const NEWS_FEED_PATH = '/news/planet_drupal.xml'
export const NEWS_FEED_TITLE = 'Drupal Mountain Camp'

/** A menu link is active on its own page and on pages below it. */
export function isActivePath(currentPath: string, linkPath?: string | null) {
  if (!linkPath || linkPath === '/') {
    return currentPath === linkPath
  }
  return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)
}
