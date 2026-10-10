import {
  appendResponseHeader,
  getHeaders,
  getQuery,
  setResponseHeader,
  setResponseStatus,
  type H3Event,
} from 'h3'
import { defineGraphqlServerOptions } from 'nuxt-graphql-middleware/server-options'
import type { FetchError } from 'ofetch'
import { extractCacheability } from './utils/cacheability'
import { withTrustedForwardedHost } from './utils/trustedHost'
import {
  BACKEND_RETRY_AFTER_SECONDS,
  BACKEND_UNAVAILABLE_UPSTREAM_STATUSES,
  backendFetchTimeout,
  resolveQueryTimeout,
  type GraphqlCacheability,
} from './helpers'

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
]

export default defineGraphqlServerOptions<{
  __cacheability?: GraphqlCacheability
}>({
  graphqlEndpoint() {
    const config = useRuntimeConfig()
    return `${config.backendUrl}/graphql`
  },
  serverFetchOptions(event: H3Event | undefined, operation) {
    const config = useRuntimeConfig()
    const timeout = backendFetchTimeout(
      operation,
      resolveQueryTimeout(config.backendQueryTimeoutMs),
    )

    if (event) {
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
        headers: withTrustedForwardedHost(
          headers,
          process.env.LAGOON_ENVIRONMENT_TYPE,
        ),
        timeout,
      }
    }

    return { timeout }
  },
  onServerResponse(event, graphqlResponse) {
    // Pass Drupal's cookies on to the browser, one header per cookie:
    // headers.get('set-cookie') joins them into a single invalid header.
    // Appended, so cookies already set on this response are kept. Only
    // browser requests get them: during SSR this event is an internal
    // sub-request whose headers don't reach the page response.
    const cookies: string[] = graphqlResponse.headers.getSetCookie()
    cookies.forEach((cookie) =>
      appendResponseHeader(event, 'set-cookie', cookie),
    )

    const cacheability = extractCacheability(graphqlResponse, event)

    // Drupal set a cookie, so a page rendered from this response may be
    // specific to this visitor. Only affects SSR (__cacheability below).
    if (cookies.length) {
      cacheability.isCacheable = false
    }

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
  onServerError(event: H3Event, error: FetchError) {
    // No response (unreachable or timed out), or nginx answering for a
    // Drupal that is down: unavailable, not a broken request.
    const upstreamStatus = error?.response?.status
    if (
      upstreamStatus === undefined ||
      BACKEND_UNAVAILABLE_UPSTREAM_STATUSES.includes(upstreamStatus)
    ) {
      setResponseStatus(event, 503)
      setResponseHeader(event, 'retry-after', BACKEND_RETRY_AFTER_SECONDS)
      return
    }

    // Directly set the response status so we don't render the Nuxt 404 page.
    setResponseStatus(event, 500)
  },
})
