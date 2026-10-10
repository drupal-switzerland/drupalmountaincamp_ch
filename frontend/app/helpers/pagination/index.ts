import type { LocationQuery } from 'vue-router'

// List offsets are GraphQL Ints (32-bit signed).
const MAX_OFFSET = 2_147_483_647

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

/** A path without trailing slashes; "/" stays as it is. */
export function canonicalPath(path: string): string {
  let end = path.length
  while (end > 1 && path[end - 1] === '/') {
    end--
  }
  return path.slice(0, end)
}

/**
 * Absolute canonical URL of one page of a paginated list. Page 1 has no
 * `?page=` parameter, matching canonicalPageQuery().
 */
export function canonicalPageUrl(
  origin: string,
  path: string,
  page: number,
): string {
  const url = new URL(path, origin)
  if (page > 1) {
    url.searchParams.set('page', String(page))
  }
  return url.href
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

export function isOffsetInRange(page: number, pageSize: number): boolean {
  return (page - 1) * pageSize <= MAX_OFFSET
}

export type ListPageState = 'pending' | 'ok' | 'notFound' | 'failed'

/**
 * State of one page of a paginated list. Only a loaded list can say a page
 * doesn't exist: a failed request is never a 404.
 */
export function getListPageState(input: {
  page: number
  pageSize: number
  status: 'idle' | 'pending' | 'success' | 'error'
  // Null when the response has no list (GraphQL errors).
  total: number | null
}): ListPageState {
  if (!isOffsetInRange(input.page, input.pageSize)) {
    return 'notFound'
  }
  if (input.status === 'error') {
    return 'failed'
  }
  if (input.status !== 'success') {
    return 'pending'
  }
  if (input.total === null) {
    return 'failed'
  }
  return input.page > totalPages(input.total, input.pageSize)
    ? 'notFound'
    : 'ok'
}
