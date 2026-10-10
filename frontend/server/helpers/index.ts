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
