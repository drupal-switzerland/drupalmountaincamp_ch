// Drupal builds absolute file URLs from the request host, and its GraphQL
// cache does not vary by host, so a request on an internal hostname can leak
// that host to every visitor. Files are always served from the site's own
// origin, so the frontend only ever needs their path.
const DRUPAL_FILE_PATH_PREFIXES = ['/sites/', '/system/files/'] as const

const ABSOLUTE_URL = /^https?:\/\//i

/** Root-relative path for a Drupal file URL; other URLs are returned as is. */
export function toDrupalFilePath(url: string): string
export function toDrupalFilePath(
  url: string | null | undefined,
): string | undefined
export function toDrupalFilePath(url: string | null | undefined) {
  if (!url || !ABSOLUTE_URL.test(url)) {
    return url ?? undefined
  }
  const { pathname, search, hash } = new URL(url)
  const isDrupalFile = DRUPAL_FILE_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )
  return isDrupalFile ? `${pathname}${search}${hash}` : url
}
