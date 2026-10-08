/** Main menu link rendered as the Tickets button. */
export const TICKETS_PATH = '/tickets'

/** A menu link is active on its own page and on pages below it. */
export function isActivePath(currentPath: string, linkPath?: string | null) {
  if (!linkPath || linkPath === '/') {
    return currentPath === linkPath
  }
  return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)
}
