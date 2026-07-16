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

  // Let's try to fetch the data from the cache first.
  const event = useRequestEvent()
  const { value, addToCache } = await useDataCache<InitData>(
    'initData_' + currentLanguage.value,
    event,
  )
  if (value) {
    data.value = value
    return data
  }

  // If the data is not in the cache, we fetch it from the payload / useState().
  if (data.value) {
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
  data.value = await useGraphqlQuery({
    name: 'initData',
    fetchOptions: {
      query: {
        language: currentLanguage.value,
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

  return data
}
