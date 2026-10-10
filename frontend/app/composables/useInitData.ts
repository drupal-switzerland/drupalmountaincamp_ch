import type {
  GlobalConfigFragment,
  InitDataQuery,
  MenuLinkTreeElementFirstFragment,
} from '#graphql-operations'

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
      string | { singular?: string; plural?: string }
    >,
  ).reduce<Record<string, string | [string, string]>>(
    (acc, [fullKey, value]) => {
      const keyWithDots = fullKey.replace('__', '.')
      if (typeof value === 'string') {
        acc[keyWithDots] = value
      } else if (typeof value === 'object' && value.plural && value.singular) {
        acc[keyWithDots] = [value.singular, value.plural]
      }
      return acc
    },
    {},
  )
}

export default async function (): Promise<Ref<InitData>> {
  const currentLanguage = useCurrentLanguage()
  const data = useState<InitData>('initData')

  // Already loaded in this render or hydrated from the payload. Reading the
  // cache again would replace the state with a new copy, and components
  // that compare menu links by identity would then render differently on the
  // server than on the client.
  if (data.value) {
    return data
  }

  const event = useRequestEvent()
  const { value, addToCache } = await useDataCache<InitData>(
    'initData_' + currentLanguage.value,
    event,
  )
  if (value) {
    data.value = value
    return data
  }

  const config = useRuntimeConfig()
  // Read the host from .env NUXT_HOST to support multisite setup.
  // Read the host from .env NUXT_HOST to support multisite setup.
  const url = useRequestURL()
  let host = url.hostname
  if (import.meta.server) {
    host = config.requestHost
  }

  // Fetch the data from the server.
  data.value = await fetchInitData(
    currentLanguage.value,
    host,
    addToCache,
  ).catch((error: unknown) => {
    // The header and footer still render without menus, so an error page
    // shows the site chrome even when Drupal is down. The GraphQL plugin has
    // already marked this render uncacheable.
    console.error('initData could not be loaded from Drupal.', error)
    return fallbackInitData(config.easyTextsDefaults as Record<string, string>)
  })
  return data
}

// What renders when Drupal can't be reached: no menus, English default texts
// (server-only runtime config, so empty on the client).
function fallbackInitData(defaultTexts: Record<string, string> = {}): InitData {
  return {
    mainMenuLinks: [],
    footerMenuLinks: [],
    translations: defaultTexts,
    globalConfig: {},
  }
}

async function fetchInitData(
  language: string,
  host: string,
  addToCache: (value: InitData, tags: string[]) => Promise<void> | void,
): Promise<InitData> {
  return useGraphqlQuery({
    name: 'initData',
    fetchOptions: {
      query: {
        language,
        __server: 'true',
      },
      headers: {
        host,
        'x-forwarded-host': host,
      },
    },
  }).then((v) => {
    const initData = {
      mainMenuLinks: v.data.mainMenu?.links || [],
      footerMenuLinks: v.data.footerMenu?.links || [],
      globalConfig: v.data.globalConfig || {},
      translations: getTranslations(v.data),
    }

    // The cache tags are coming from the onServerResponse() function in the graphqlMiddleware.

    if (
      import.meta.server &&
      v.__cacheability?.isCacheable &&
      v.__cacheability.tagsNuxt
    ) {
      addToCache(initData, v.__cacheability.tagsNuxt)
    }

    return initData
  })
}
