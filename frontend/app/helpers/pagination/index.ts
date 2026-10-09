import type { LocationQuery } from 'vue-router'

/**
 * Page number from a `?page=` query value: a positive integer, 1 otherwise
 * (missing, empty, negative, zero, decimal or non-numeric).
 */
export function parsePageParam(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return 1
  }
  const page = Number(raw)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

/**
 * The query with `page` set for the given page. Page 1 has no parameter, so
 * every page has a single canonical URL.
 */
export function withPageParam(
  query: LocationQuery,
  page: number,
): LocationQuery {
  const result = { ...query }
  delete result.page
  if (page > 1) {
    result.page = String(page)
  }
  return result
}

/**
 * The canonical query for a URL's `?page=` value, or null when the query is
 * already canonical.
 */
export function canonicalPageQuery(query: LocationQuery): LocationQuery | null {
  const canonical = withPageParam(query, parsePageParam(query.page))
  return canonical.page === query.page ? null : canonical
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * Whether a link click navigates in this tab, mirroring RouterLink: primary
 * button and no modifier (new tab or window). defaultPrevented isn't checked:
 * RouterLink's own handler may already have prevented the default.
 */
export function isSameTabClick(
  event: Pick<
    MouseEvent,
    'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}
