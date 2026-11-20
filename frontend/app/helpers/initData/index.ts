import type {
  GlobalConfigFragment,
  InitDataQuery,
  MenuLinkTreeElementFirstFragment,
} from '#graphql-operations'
import type { GraphqlCacheability } from '~~/server/helpers'

export interface InitData {
  mainMenuLinks: MenuLinkTreeElementFirstFragment[]
  footerMenuLinks: MenuLinkTreeElementFirstFragment[]
  translations: Record<string, string | [string, string]>
  globalConfig: {
    address?: GlobalConfigFragment['address']
  }
}

function getTranslations(
  v?: InitDataQuery,
): Record<string, string | [string, string]> {
  if (!v) {
    return {}
  }
  return Object.entries(
    (v.translations || {}) as Record<
      string,
      string | { singular?: string; plural?: string } | null
    >,
  ).reduce<Record<string, string | [string, string]>>(
    (acc, [fullKey, value]) => {
      const keyWithDots = fullKey.replace('__', '.')
      if (typeof value === 'string') {
        acc[keyWithDots] = value
      } else if (value?.plural && value.singular) {
        acc[keyWithDots] = [value.singular, value.plural]
      }
      return acc
    },
    {},
  )
}

/** The init data of the app from the response of the initData query. */
export function buildInitData(data: InitDataQuery): InitData {
  return {
    mainMenuLinks: data.mainMenu?.links || [],
    footerMenuLinks: data.footerMenu?.links || [],
    globalConfig: data.globalConfig || {},
    translations: getTranslations(data),
  }
}

// What renders when Drupal can't be reached: no menus, English default texts
// (server-only runtime config, so empty on the client).
export function fallbackInitData(
  defaultTexts: Record<string, string> = {},
): InitData {
  return {
    mainMenuLinks: [],
    footerMenuLinks: [],
    translations: defaultTexts,
    globalConfig: {},
  }
}

/**
 * The tags to store init data in the data cache with, or undefined when the
 * response it came from must not be cached.
 */
export function getInitDataCacheTags(
  cacheability: GraphqlCacheability | undefined,
): string[] | undefined {
  if (cacheability?.isCacheable && cacheability.tagsNuxt) {
    return cacheability.tagsNuxt
  }
  return undefined
}
