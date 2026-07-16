import { getHeaders, type H3Event } from 'h3'
import { defineGraphqlServerOptions } from 'nuxt-graphql-middleware/server-options'
import { extractCacheability } from './utils/cacheability'
import type { GraphqlCacheability } from './helpers'

const HEADER_KEYS: string[] = [
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-server',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-client-ip',
  'x-real-ip',
  'x-client-ssl',
  'sec-fetch-site',
  'sec-ch-ua-platform',
  'sec-ch-ua',
  'referer',
  'user-agent',
  'user-agent-https',
  'cookie',
  'authorization',
]

export default defineGraphqlServerOptions<{
  __cacheability?: GraphqlCacheability
}>({
  graphqlEndpoint(event: H3Event) {
    const config = useRuntimeConfig()
    return `${config.backendUrl}/graphql`
  },
  serverFetchOptions(event: H3Event | undefined) {
    if (event) {
      const config = useRuntimeConfig()
      const incomingHeaders = getHeaders(event) as Record<string, string>

      const headers: Record<string, string> = {
        'x-drupal-graphql-token': config.drupalGraphqlToken,
      }

      HEADER_KEYS.forEach((key: string) => {
        const value = incomingHeaders[key]
        if (value) {
          headers[key] = value
        }
      })

      return {
        headers,
      }
    }

    return {}
  },
  onServerResponse(event: H3Event, graphqlResponse: any) {
    // Pass the set-cookie header from the GraphQL response to the client.
    const setCookie = graphqlResponse.headers.get('set-cookie')

    if (setCookie) {
      event.node.res.setHeader('set-cookie', setCookie)
    }

    const cacheability = extractCacheability(graphqlResponse, event)

    const hasMessages = !!(
      graphqlResponse._data?.data &&
      'messengerMessages' in graphqlResponse._data.data &&
      graphqlResponse._data.data.messengerMessages?.length
    )

    // Mark as uncacheable if the response contains Drupal messages.
    if (hasMessages) {
      cacheability.isCacheable = false
    }

    // This is only provided when the request originates from SSR.
    // We pass information about the cacheability along the GraphQL response,
    // so that the Nuxt app is able to use this to determine if the
    // rendered page can be cached or not.
    const addCacheability =
      getQuery(event).__server === 'true' || import.meta.dev

    // Return the GraphQL response.
    return {
      data: graphqlResponse._data!.data,
      errors: graphqlResponse._data!.errors,
      __cacheability: addCacheability ? cacheability : undefined,
    }
  },
  onServerError(event: H3Event) {
    // Directly set the response status so we don't render the Nuxt 404 page.
    setResponseStatus(event, 500)
  },
})
