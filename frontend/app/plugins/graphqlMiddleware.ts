import { defineNuxtPlugin } from 'nuxt/app'
import type { DrupalMessage } from '~/composables/useDrupalMessages'
import type { GraphqlResponseTyped } from '#nuxt-graphql-middleware/response'
import { getPageCacheability } from '~/helpers/graphqlCacheability'
import {
  guardBackendRequest,
  handleBackendResponseError,
} from '~/helpers/backendUnavailable'

type GraphqlMessengerMessage = {
  type: string
  message: string
  escaped: string
  safe: string
}

/**
 * Try to extract the messages from a GraphQL query or mutation.
 */
function extractMessages(data: GraphqlResponseTyped): DrupalMessage[] {
  if (data.data && 'messengerMessages' in data.data) {
    return data.data.messengerMessages.map((v: GraphqlMessengerMessage) => {
      return {
        type: v.type,
        message: v.safe,
      }
    })
  }

  return []
}

/**
 * This is only called when performing a query or mutation from within the nuxt
 * app (e.g. not via custom server routes).
 */
export default defineNuxtPlugin({
  name: 'graphql-fetch-options',
  dependsOn: ['nuxt-graphql-middleware-provide-state'],
  setup() {
    const state = useGraphqlState()
    const { messages } = useDrupalMessages()
    const language = useCurrentLanguage()
    const config = useRuntimeConfig()
    const backendUnavailable = useBackendUnavailable()
    // Nuxt renders the error page in a separate internal request, so a 503
    // from this render's page carries the flag over to that one.
    if (import.meta.server && useError().value?.statusCode === 503) {
      backendUnavailable.value = true
    }

    if (!state) {
      return
    }

    // A page rendered from a failed request must not be cached.
    function markPageUncacheable() {
      if (import.meta.server) {
        useCDNHeaders((helper) => helper.private(), useRequestEvent())
      }
    }

    state.fetchOptions = {
      // A server render must not wait for Drupal's timeout twice; the browser
      // keeps ofetch's default retry.
      retry: import.meta.server ? 0 : undefined,

      /**
       * Interceptor called whenever a GraphQL response arrives.
       */
      onResponse(result) {
        const data = result.response?._data

        if (import.meta.server) {
          const cacheability = getPageCacheability(data)
          useCDNHeaders((helper) => {
            if (!cacheability) {
              helper.private()
              return
            }

            helper
              .public()
              .setNumeric('maxAge', cacheability.maxAge)
              .addTags(cacheability.tagsCdn)
          }, useRequestEvent())
        }

        if (!data) {
          return
        }

        // Extract drupal messages from every GraphQL response.
        extractMessages(data).forEach((v) => {
          const exists = messages.value.find((m) => m.message === v.message)
          if (!exists) {
            messages.value.push(v)

            // When there are messages, we have to make the whole request uncacheable.
            useCDNHeaders((v) => v.private())
          }
        })
      },

      onRequestError: markPageUncacheable,
      onResponseError({ response }) {
        if (import.meta.server) {
          handleBackendResponseError(
            response.status,
            backendUnavailable,
            markPageUncacheable,
          )
        }
      },

      onRequest({ options, request }) {
        if (import.meta.server && import.meta.dev) {
          console.log('GraphQL Query: ' + request)
        }
        // Drupal already failed to answer during this render: fail at once
        // instead of waiting for the timeout again. It throws, because Nitro's
        // internal fetch ignores an abort signal.
        if (import.meta.server) {
          guardBackendRequest(backendUnavailable, markPageUncacheable)
        }
        try {
          if (!options.params) {
            options.params = {}
          }

          // Add the build ID (unique per Nuxt build) to every GraphQL request.
          // We do this so that after a deployment, if the user is using the
          // "new" version of the app, the request URL issued is now different
          // than the previous one and thus will not be served from cache.
          options.params.__h = config.app.buildId

          // Add the current language to the URL
          options.params.__l = language.value

          if (import.meta.server) {
            options.params.__server = 'true'
          }

          const requestHeaders = useRequestHeaders()
          Object.keys(requestHeaders).forEach((key) => {
            const value = requestHeaders[key]
            if (value != null) {
              const headerValue = Array.isArray(value)
                ? value.join(', ')
                : value
              options.headers?.append(key, headerValue)
            }
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Do nothing.
        }
      },
    }
  },
})
