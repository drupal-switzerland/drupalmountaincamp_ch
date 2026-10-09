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

export const INTERVALS = {
  '5min': 5 * 60,
  '10min': 10 * 60,
  '15min': 15 * 60,
  '30min': 30 * 60,
  '1hour': 60 * 60,
  '2hours': 60 * 60 * 2,
  '6hours': 60 * 60 * 6,
  '1week': 60 * 60 * 24 * 7,
} as const

export type ValidInterval = keyof typeof INTERVALS | 'midnight'

/**
 * Upper bound for one request from Nuxt to Drupal. An unresponsive backend
 * otherwise holds every page render for the OS connect timeout (~20s per
 * request, several requests per page) before the error page shows. The
 * slowest real request measured locally after a full cache clear was 1.2s
 * (initData), so this leaves wide headroom.
 */
export const BACKEND_FETCH_TIMEOUT_MS = 10_000

/** Retry-After hint, in seconds, on a 503 when Drupal gave no response. */
export const BACKEND_RETRY_AFTER_SECONDS = 30
