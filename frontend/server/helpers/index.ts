export type GraphqlCacheability = {
  isCacheable: boolean
  tagsNuxt: string[]
  tagsCdn: string[]
  tagsDrupal: string[]
  maxAge: number
}

export const MAX_AGE = {
  UNCACHEABLE: 0,
  TWO_HOURS: 7200,
  SIX_HOURS: 21_600,
  FIVE_MINUTES: 5 * 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 86_400,
  ONE_WEEK: 86_400 * 7,
  ONE_YEAR: 86_400 * 365,
}

/** The operation type nuxt-graphql-middleware passes for a GraphQL query. */
const QUERY_OPERATION = 'query'

/**
 * Default upper bound for one read from Nuxt to Drupal (GraphQL queries and
 * the icon proxy). An unresponsive backend otherwise holds every page render
 * for the OS connect timeout (~20s per request, several requests per page)
 * before the error page shows. The slowest real request measured locally
 * after a full cache clear was 1.2s (initData); the first request after a
 * deploy's cache rebuild on production may be slower, hence the headroom.
 * Override per environment with NUXT_BACKEND_QUERY_TIMEOUT_MS.
 */
export const BACKEND_QUERY_TIMEOUT_MS = 15_000

/**
 * Upper bound for mutations and uploads (blokkli saves, publishing, media).
 * Much longer than a read: aborting one in Nuxt doesn't stop Drupal from
 * committing it, so the editor would see a failure for a change that went
 * through.
 */
export const BACKEND_WRITE_TIMEOUT_MS = 120_000

// One value for the API route's 503 and the page-level one.
export { BACKEND_RETRY_AFTER_SECONDS } from '../../app/helpers/backendUnavailable'

/**
 * Upstream statuses that mean Drupal itself didn't answer: nginx sits between
 * Nuxt and Drupal, so php-fpm down is a 502 and maintenance or an overloaded
 * backend a 503 or 504.
 */
export const BACKEND_UNAVAILABLE_UPSTREAM_STATUSES: readonly number[] = [
  502, 503, 504,
]

let warnedAboutQueryTimeout = false

/**
 * The query timeout from runtime config (NUXT_BACKEND_QUERY_TIMEOUT_MS), or
 * the default when it is unset or not a positive number.
 */
export function resolveQueryTimeout(configured: unknown): number {
  const value = typeof configured === 'string' ? Number(configured) : configured
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }
  if (
    configured !== undefined &&
    configured !== '' &&
    !warnedAboutQueryTimeout
  ) {
    warnedAboutQueryTimeout = true
    console.warn(
      `Ignoring backendQueryTimeoutMs "${String(configured)}": not a positive number. Using ${BACKEND_QUERY_TIMEOUT_MS}ms.`,
    )
  }
  return BACKEND_QUERY_TIMEOUT_MS
}

/**
 * Timeout for one GraphQL request to Drupal: only queries get the short
 * bound; mutations, uploads and anything without a known type get the long
 * one.
 */
export function backendFetchTimeout(
  operation: string | null | undefined,
  queryTimeoutMs: number,
): number {
  return operation === QUERY_OPERATION
    ? queryTimeoutMs
    : BACKEND_WRITE_TIMEOUT_MS
}
