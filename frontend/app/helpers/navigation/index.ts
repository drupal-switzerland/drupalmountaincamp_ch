/** Main menu link rendered as the Tickets button. */
export const TICKETS_PATH = '/tickets'

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
