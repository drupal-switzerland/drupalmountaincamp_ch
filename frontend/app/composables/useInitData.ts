import {
  buildInitData,
  fallbackInitData,
  getInitDataCacheTags,
  type InitData,
} from '~/helpers/initData'

export type { InitData }

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
    const initData = buildInitData(v.data)

    // The cache tags are coming from the onServerResponse() function in the graphqlMiddleware.
    const cacheTags = getInitDataCacheTags(v.__cacheability)
    if (import.meta.server && cacheTags) {
      addToCache(initData, cacheTags)
    }

    return initData
  })
}
