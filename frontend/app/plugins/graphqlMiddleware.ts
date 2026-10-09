import { defineNuxtPlugin } from 'nuxt/app'
import type { DrupalMessage } from '~/composables/useDrupalMessages'
import type { GraphqlResponseTyped } from '#nuxt-graphql-middleware/response'
import { getPageCacheability } from '~/helpers/graphqlCacheability'

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
export default defineNuxtPlugin(() => {
  const state = useGraphqlState()
  const { messages } = useDrupalMessages()
  const language = useCurrentLanguage()
  const config = useRuntimeConfig()

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
    onResponseError: markPageUncacheable,

    onRequest({ options, request }) {
      if (import.meta.server && import.meta.dev) {
        console.log('GraphQL Query: ' + request)
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
            const headerValue = Array.isArray(value) ? value.join(', ') : value
            options.headers?.append(key, headerValue)
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Do nothing.
      }
    },
  }
})
